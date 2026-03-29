import { prisma } from '@/lib/prisma'
import { CaixaRepository } from '@/repositories/caixa.repository'
import { Prisma } from '@prisma/client'
import { sseEmitter } from '@/lib/sse-emitter'

type PagarPedidoInput = {
  pedidoId: string
  caixaId: string
  formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'
  idempotencyKey: string
}

export class CaixaService {
  private repository: CaixaRepository

  constructor() {
    this.repository = new CaixaRepository()
  }

  async getFila() {
    return this.repository.fetchFila()
  }

  async cancelarItem(itemId: string, usuarioId: string, motivo: string, quantidadeCancelada?: number) {
    // Usa transação pois pode desmembrar um item parcialmente
    return await prisma.$transaction(async (tx: any) => {
      const item = await tx.itemPedido.findUnique({
        where: { id: itemId },
        include: { pedido: true }
      })

      if (!item) throw new Error('NOT_FOUND: Item não encontrado')
      if (item.status === 'CANCELADO') throw new Error('CONFLICT: Item já foi cancelado')
      if (item.pedido.orderStatus !== 'AGUARDANDO_COBRANCA') {
        throw new Error('CONFLICT: O pedido não está aguardando cobrança')
      }

      const qtdACancelar = quantidadeCancelada || item.quantidade

      if (qtdACancelar <= 0 || qtdACancelar > item.quantidade) {
        throw new Error('BAD_REQUEST: Quantidade a cancelar inválida')
      }

      if (qtdACancelar === item.quantidade) {
        // Cancelamento total
        await tx.itemPedido.update({
          where: { id: itemId },
          data: {
            status: 'CANCELADO',
            motivoCancelamento: motivo,
            canceladoPorId: usuarioId,
            canceladoEm: new Date()
          }
        })
      } else {
        // Cancelamento parcial
        // 1. Reduz o ativo atual
        await tx.itemPedido.update({
          where: { id: itemId },
          data: { quantidade: item.quantidade - qtdACancelar }
        })

        // 2. Cria um espelho cancelado
        await tx.itemPedido.create({
          data: {
            pedidoId: item.pedidoId,
            produtoId: item.produtoId,
            nomeSnapshot: item.nomeSnapshot,
            precoSnapshot: item.precoSnapshot,
            quantidade: qtdACancelar,
            status: 'CANCELADO',
            motivoCancelamento: motivo,
            canceladoPorId: usuarioId,
            canceladoEm: new Date()
          }
        })
      }

      // Recalculo do totalBruto pro REST
      const itensRestantes = await tx.itemPedido.findMany({
        where: { pedidoId: item.pedidoId, status: 'ATIVO' }
      })
      
      const totalBrutoNovo = itensRestantes.reduce((acc: number, curr: any) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)
      
      await tx.pedido.update({
        where: { id: item.pedidoId },
        data: {
          totalBruto: new Prisma.Decimal(totalBrutoNovo)
        }
      })

      sseEmitter.emit('pedido_pago')

      return { success: true }
    })
  }

  async pagarPedido(data: PagarPedidoInput) {
    // Inicia Transação Segura com Travamento
    return await prisma.$transaction(async (tx: any) => {
      // 1. Double-spend prevention via idempotency
      const pedidoExistente = await tx.pedido.findFirst({
        where: { idempotencyKey: data.idempotencyKey }
      })

      if (pedidoExistente) {
         // Se já processou essa exata requisição, retorne o existente (Idempotency Rule)
         return pedidoExistente
      }

      // 2. Trazer pedido base
      const pedidoBase = await tx.pedido.findUnique({
        where: { id: data.pedidoId },
        include: { itens: true }
      })

      if (!pedidoBase) throw new Error('NOT_FOUND: Pedido não existe')
      if (pedidoBase.orderStatus !== 'AGUARDANDO_COBRANCA') {
        throw new Error(`CONFLICT: Pedido em status incorreto: ${pedidoBase.orderStatus}`)
      }

      const itensAtivos = pedidoBase.itens.filter((i: any) => i.status === 'ATIVO')
      const itensCancelados = pedidoBase.itens.filter((i: any) => i.status === 'CANCELADO')

      // Se cancelar tudo e vier pagar:
      if (itensAtivos.length === 0) {
        throw new Error('BAD_REQUEST: Este pedido não possui itens ativos para cobrança.')
      }

      const produtoIdsSet = new Set(itensAtivos.map((i: any) => i.produtoId))
      const produtoIds = Array.from(produtoIdsSet)

      // 3. SELECT FOR UPDATE (Prevenção de sobreposição de estoques)
      // Usando template literal para total segurança (SQL Injection Proof)
      const produtosLock = await tx.$queryRaw<{ id: string, nome: string, qtdVisor: number }[]>`
        SELECT id, "nome", "qtdVisor" FROM "produtos" WHERE id IN (${Prisma.join(produtoIds)}) FOR UPDATE
      `

      if (produtosLock.length !== produtoIds.length) {
         throw new Error('NOT_FOUND: Alguns produtos do carrinho desapareceram do sistema.')
      }

      // 4. Validar as quantidades em memória protegida e montar transações
      const movimentacoes = []
      
      let somaBruto = 0
      for (const item of itensAtivos) {
         const pLock = (produtosLock as any[]).find((p: any) => p.id === (item as any).produtoId)
         
         if (!pLock || pLock.qtdVisor < (item as any).quantidade) {
            // Regra Crítica Fase 4: Se bater 0 na hora H
            throw new Error(`BAD_REQUEST: Estoque insuficiente para ${pLock?.nome || 'um produto'}. Cancele o item e tente novamente.`)
         }

         // Encadeia um decremento no Model
         await tx.produto.update({
           where: { id: pLock.id },
           data: { qtdVisor: { decrement: (item as any).quantidade } }
         })

         somaBruto += (Number((item as any).precoSnapshot) * (item as any).quantidade)

         movimentacoes.push({
           produtoId: (item as any).produtoId,
           tipo: 'VENDA',
           origem: 'VISOR',
           quantidade: (item as any).quantidade,
           pedidoId: pedidoBase.id,
           usuarioId: data.caixaId,
           observacao: `Venda Pedido ${pedidoBase.codigo}`
         })
      }

      let somaCancelada = 0
      for (const canc of itensCancelados) {
         somaCancelada += (Number((canc as any).precoSnapshot) * (canc as any).quantidade)
      }

      // 5. Insert History
      if (movimentacoes.length > 0) {
        await tx.movimentacaoEstoque.createMany({
          data: movimentacoes
        })
      }

      // 6. Atualizar Total do Pedido
      const pedidoProcessado = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: {
          totalBruto: new Prisma.Decimal(somaBruto),
          totalCancelado: new Prisma.Decimal(somaCancelada),
          // totalFinal é Bruto (já não leva conta os cancelados).
          totalFinal: new Prisma.Decimal(somaBruto),
          
          orderStatus: 'PAGO',
          paymentStatus: 'PAGO',
          formaPagamento: data.formaPagamento,
          pagoEm: new Date(),
          caixaId: data.caixaId,
          idempotencyKey: data.idempotencyKey
        }
      })

      // Aviso emitido APÓS transação (Sera disparado na Rota HTTP apos suceso pro frontend não escutar antes do DB relatar commit real)
      // Porém pode ser feito no retorno ou aqui (vamos colocar no router HTTP pra segurança de commit sync)
      
      return pedidoProcessado
    })
  }
}
