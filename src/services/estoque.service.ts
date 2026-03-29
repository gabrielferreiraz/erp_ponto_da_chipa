import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class EstoqueService {
  /**
   * Traz lista agregada de Estoque e KPIs em uma única ida ao DB
   */
  async getDashboardEstoque() {
    const produtos = await prisma.produto.findMany({
      include: { categoria: { select: { nome: true } } },
      orderBy: [
        { categoria: { ordem: 'asc' } },
        { nome: 'asc' }
      ]
    })

    let alertas = 0
    let zerados = 0
    let totalMercadorias = 0

    const itensMapeados = produtos.map((p: any) => {
      const soma = p.qtdEstoque + p.qtdVisor
      totalMercadorias += soma
      
      let statusAlert = 'OK'
      if (soma === 0) {
        statusAlert = 'CRITICO'
        zerados++
      } else if (soma <= p.estoqueMinimo) {
        statusAlert = 'ALERTA'
        alertas++
      }

      return {
        id: p.id,
        nome: p.nome,
        categoria: p.categoria.nome,
        qtdEstoque: p.qtdEstoque,
        qtdVisor: p.qtdVisor,
        total: soma,
        estoqueMinimo: p.estoqueMinimo,
        status: statusAlert,
        imagemUrl: p.imagemUrl
      }
    })

    // Retorna a página preenchida de uma vez pro front
    return {
      produtos: itensMapeados,
      kpis: {
        alertas,
        zerados,
        totalMercadorias
      }
    }
  }

  async getMovimentacoes(page: number, limit: number, produtoId?: string) {
    const skip = (page - 1) * limit
    const whereArg = produtoId && produtoId !== 'all' ? { produtoId } : {}
    
    // Contagem Rápida Puxa total de registros
    const total = await prisma.movimentacaoEstoque.count({ where: whereArg })
    
    const registros = await prisma.movimentacaoEstoque.findMany({
      where: whereArg,
      include: {
        produto: { select: { nome: true } },
        usuario: { select: { nome: true } }
      },
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit
    })

    return {
       data: registros,
       hasMore: skip + limit < total,
       total
    }
  }

  async reporVisor(produtoId: string, quantidade: number, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock Row do produto
      const produtosLock = await tx.$queryRaw`
        SELECT id, "qtdEstoque", "qtdVisor", "nome" FROM "produtos" WHERE id = ${produtoId} FOR UPDATE
      ` as { id: string, qtdEstoque: number, qtdVisor: number, nome: string }[]
      
      if (produtosLock.length === 0) throw new Error('NOT_FOUND: Produto inexistente')
      const pData = produtosLock[0]

      // 2. Validação Tardia Segura
      if (pData.qtdEstoque < quantidade) {
        throw new Error(`BAD_REQUEST: Quantidade em depósito insuficiente do produto ${pData.nome}. Disponível: ${pData.qtdEstoque}`)
      }

      // 3. Modifica Balanço
      await tx.produto.update({
        where: { id: produtoId },
        data: {
          qtdEstoque: { decrement: quantidade },
          qtdVisor: { increment: quantidade }
        }
      })

      // 4. Cria Auditoria
      const aud = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: 'REPOSICAO_VISOR',
          origem: 'ESTOQUE',
          quantidade, // O painel frontend traduz como saída do estoque pro visor
          usuarioId: adminId,
          observacao: 'Reposição transferida para o Salão'
        }
      })
      return aud
    })
  }

  async registrarEntrada(produtoId: string, quantidade: number, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      // Locking não machuca aqui, mas garante ordem
      const produtosLock = await tx.$queryRaw`
        SELECT id FROM "produtos" WHERE id = ${produtoId} FOR UPDATE
      ` as { id: string }[]
      if (produtosLock.length === 0) throw new Error('NOT_FOUND: Produto inexistente')

      await tx.produto.update({
        where: { id: produtoId },
        data: { qtdEstoque: { increment: quantidade } }
      })

      const aud = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: 'ENTRADA_ESTOQUE',
          origem: 'ESTOQUE',
          quantidade,
          usuarioId: adminId,
          observacao: 'Entrada de nova mercadoria no Depósito'
        }
      })
      return aud
    })
  }

  async ajusteVisor(produtoId: string, quantidadeDiferenca: number, motivo: string, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const produtosLock = await tx.$queryRaw`
        SELECT id, "qtdVisor", "nome" FROM "produtos" WHERE id = ${produtoId} FOR UPDATE
      ` as { id: string, qtdVisor: number, nome: string }[]
      if (produtosLock.length === 0) throw new Error('NOT_FOUND: Produto inexistente')
      const pData = produtosLock[0]

      const novoVisor = pData.qtdVisor + quantidadeDiferenca
      if (novoVisor < 0) {
        throw new Error(`BAD_REQUEST: Ajuste negativo supera o visor. Total em mesa: ${pData.qtdVisor}`)
      }

      await tx.produto.update({
        where: { id: produtoId },
        data: { qtdVisor: novoVisor }
      })

      const aud = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: 'AJUSTE',
          origem: 'VISOR',
          quantidade: quantidadeDiferenca,
          usuarioId: adminId,
          observacao: motivo
        }
      })
      return aud
    })
  }

  async registrarPerda(produtoId: string, quantidade: number, motivo: string, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const produtosLock = await tx.$queryRaw`
        SELECT id, "qtdVisor", "nome" FROM "produtos" WHERE id = ${produtoId} FOR UPDATE
      ` as { id: string, qtdVisor: number, nome: string }[]
      if (produtosLock.length === 0) throw new Error('NOT_FOUND: Produto inexistente')
      const pData = produtosLock[0]

      const novoVisor = pData.qtdVisor - quantidade
      if (novoVisor < 0) {
        throw new Error(`BAD_REQUEST: Perda supera a quantidade que existe no visor. Limite: ${pData.qtdVisor}`)
      }

      await tx.produto.update({
        where: { id: produtoId },
        data: { qtdVisor: novoVisor }
      })

      const aud = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: 'PERDA',
          origem: 'VISOR',
          quantidade: quantidade, // Módulo da perda (O UI põe sinal - na view se quiser, mas quantidade abs eh melhor)
          usuarioId: adminId,
          observacao: motivo
        }
      })
      return aud
    })
  }

}
