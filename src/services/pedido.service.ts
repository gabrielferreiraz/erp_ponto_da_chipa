import { PedidoRepository } from '@/repositories/pedido.repository'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { sseEmitter } from '@/lib/sse-emitter'
import { turnoState } from '@/lib/turno-state'

type ItemParams = { produtoId: string; quantidade: number }
type CreateParams = {
  tipo: 'LOCAL' | 'VIAGEM'
  mesaId?: string | null
  observacao?: string | null
  itens: ItemParams[]
  atendenteId: string
}

type UpdateParams = {
  id: string
  itens?: ItemParams[]
  mesaId?: string | null
  observacao?: string | null
  atendenteId: string
}

export class PedidoService {
  private repository: PedidoRepository

  constructor() {
    this.repository = new PedidoRepository()
  }

  private checkClosingShift() {
    if (turnoState.get()) {
      throw new Error('FECHAMENTO_EM_ANDAMENTO: Não é possível realizar esta operação enquanto o fechamento de turno estiver em andamento.')
    }
  }

  async getPedidosAtendente(atendenteId: string) {
    return this.repository.findAtivasByAtendente(atendenteId)
  }

  private async checkDisponibilityAndBuildItems(itensParams: ItemParams[]) {
    this.checkClosingShift()
    const ids = itensParams.map(i => i.produtoId)
    const produtos = await prisma.produto.findMany({ where: { id: { in: ids } } })

    let totalBrutoNum = 0
    const buildedItems: Prisma.ItemPedidoCreateWithoutPedidoInput[] = []

    for (const itemParam of itensParams) {
      const p = produtos.find(p => p.id === itemParam.produtoId)
      if (!p) throw new Error(`NOT_FOUND: Produto não localizado (ID: ${itemParam.produtoId})`)
      if (!p.disponivel) throw new Error(`BAD_REQUEST: O produto ${p.nome} não está disponível.`)
      if (p.qtdVisor < itemParam.quantidade) {
        throw new Error(`BAD_REQUEST: Quantidade insuficiente no visor para o produto ${p.nome}. Solicitado: ${itemParam.quantidade}, Visor: ${p.qtdVisor}`)
      }

      totalBrutoNum += Number(p.preco) * itemParam.quantidade

      buildedItems.push({
        produto: { connect: { id: p.id } },
        quantidade: itemParam.quantidade,
        nomeSnapshot: p.nome,
        precoSnapshot: p.preco,
        status: 'ATIVO'
      })
    }

    return { buildedItems, totalBrutoNum }
  }

  async create(data: CreateParams) {
    this.checkClosingShift()

    // Gera código fora da transação (sequence é safe fora de tx)
    let codigoStr = ''
    try {
      const seq = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('pedido_seq')`
      codigoStr = `PED-${String(seq[0].nextval).padStart(4, '0')}`
    } catch(err) {
      console.error('Erro na Sequence de Pedido', err)
      codigoStr = `PED-${Math.floor(1000 + Math.random() * 9000)}`
    }

    return await prisma.$transaction(async (tx) => {
      const ids = data.itens.map(i => i.produtoId)

      // SELECT FOR UPDATE: impede race condition de estoque entre requisições concorrentes
      const produtosLock = await tx.$queryRaw<{ id: string; nome: string; preco: any; qtdVisor: number; disponivel: boolean }[]>`
        SELECT id, nome, preco, "qtdVisor", disponivel FROM "produtos" WHERE id IN (${Prisma.join(ids)}) FOR UPDATE
      `

      let totalBrutoNum = 0
      const buildedItems: Prisma.ItemPedidoCreateManyPedidoInput[] = []

      for (const itemParam of data.itens) {
        const p = produtosLock.find(p => p.id === itemParam.produtoId)
        if (!p) throw new Error(`NOT_FOUND: Produto não localizado (ID: ${itemParam.produtoId})`)
        if (!p.disponivel) throw new Error(`BAD_REQUEST: O produto ${p.nome} não está disponível.`)
        if (Number(p.qtdVisor) < itemParam.quantidade) {
          throw new Error(`BAD_REQUEST: Quantidade insuficiente no visor para ${p.nome}. Solicitado: ${itemParam.quantidade}, Visor: ${p.qtdVisor}`)
        }
        totalBrutoNum += Number(p.preco) * itemParam.quantidade
        buildedItems.push({
          produtoId: p.id,
          quantidade: itemParam.quantidade,
          nomeSnapshot: p.nome,
          precoSnapshot: p.preco,
          status: 'ATIVO'
        })
      }

      const totalBrutoDec = new Prisma.Decimal(totalBrutoNum)

      const created = await tx.pedido.create({
        data: {
          codigo: codigoStr,
          tipo: data.tipo,
          observacao: data.observacao,
          orderStatus: 'ABERTO',
          totalBruto: totalBrutoDec,
          totalFinal: totalBrutoDec,
          atendente: { connect: { id: data.atendenteId } },
          ...(data.mesaId ? { mesa: { connect: { id: data.mesaId } } } : {}),
          itens: { createMany: { data: buildedItems } }
        },
        include: { itens: true, mesa: true }
      })

      return {
        ...created,
        totalBruto: created.totalBruto ? Number(created.totalBruto) : 0,
        totalFinal: created.totalFinal ? Number(created.totalFinal) : 0,
        itens: created.itens.map(i => ({ ...i, precoSnapshot: Number(i.precoSnapshot) }))
      }
    })
  }

  async update(data: UpdateParams) {
    const pedidoAtual = await this.repository.findById(data.id)
    if (!pedidoAtual) throw new Error('NOT_FOUND: Pedido não encontrado.')
    
    // Regra: Atendente só edita o próprio pedido (ADMIN pode editar qualquer um)
    const isAdmin = await prisma.usuario.findUnique({ where: { id: data.atendenteId } }).then(u => u?.role === 'ADMIN')
    
    if (pedidoAtual.atendenteId !== data.atendenteId && !isAdmin) {
       throw new Error('FORBIDDEN: Você não tem permissão para editar este pedido.')
    }

    // Regra: Só pode editar se estiver em ABERTO
    if (pedidoAtual.orderStatus !== 'ABERTO') {
       throw new Error('CONFLICT: Somente pedidos com status ABERTO podem ser editados.')
    }

    const updates: any = {}
    if (data.mesaId !== undefined) {
      updates.mesaId = data.mesaId
    }
    if (data.observacao !== undefined) {
      updates.observacao = data.observacao
    }

    // Se a alteração possui itens novos
    if (data.itens) {
      const { buildedItems, totalBrutoNum } = await this.checkDisponibilityAndBuildItems(data.itens)
      const totalDec = new Prisma.Decimal(totalBrutoNum)
      // repository logic para wiper carrinho e recriar
      await this.repository.updateItems(data.id, buildedItems, totalDec)
    }

    if (Object.keys(updates).length > 0) {
      await prisma.pedido.update({
        where: { id: data.id },
        data: updates
      })
    }

    return this.repository.findById(data.id)
  }

  async confirmarPedido(pedidoId: string, atendenteId: string) {
    const pedidoAtual = await this.repository.findById(pedidoId)
    
    if (!pedidoAtual) throw new Error('NOT_FOUND: Pedido não encontrado.')
    if (pedidoAtual.atendenteId !== atendenteId) throw new Error('FORBIDDEN: Não permitido.')
    if (pedidoAtual.orderStatus !== 'ABERTO') throw new Error('CONFLICT: O pedido já não está ABERTO.')
    
    const finalizado = await this.repository.updateStatus(pedidoId, 'AGUARDANDO_COBRANCA')
    
    sseEmitter.emit('novo_pedido')
    
    return finalizado
  }
}
