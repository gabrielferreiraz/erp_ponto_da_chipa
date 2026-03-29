import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class PedidoRepository {
  async findAtivasByAtendente(atendenteId: string) {
    const pedidos = await prisma.pedido.findMany({
      where: {
        atendenteId,
        orderStatus: { in: ['ABERTO', 'AGUARDANDO_COBRANCA'] },
      },
      include: {
        mesa: true,
        itens: {
          include: {
            produto: {
              select: {
                imagemUrl: true,
              }
            }
          }
        },
      },
      orderBy: {
        criadoEm: 'desc'
      }
    })

    return pedidos.map(p => ({
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      itens: p.itens.map(i => ({
        ...i,
        precoSnapshot: Number(i.precoSnapshot)
      }))
    }))
  }

  async findById(id: string) {
    const p = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: true
      }
    })
    
    if (!p) return null

    return {
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      itens: p.itens.map(i => ({
        ...i,
        precoSnapshot: Number(i.precoSnapshot)
      }))
    }
  }

  async create(data: Prisma.PedidoCreateInput) {
    const p = await prisma.pedido.create({
      data,
      include: {
        itens: true,
        mesa: true
      }
    })

    return {
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      itens: p.itens.map(i => ({
        ...i,
        precoSnapshot: Number(i.precoSnapshot)
      }))
    }
  }

  async updateStatus(id: string, status: 'ABERTO' | 'AGUARDANDO_COBRANCA' | 'CANCELADO' | 'PAGO') {
    const p = await prisma.pedido.update({
      where: { id },
      data: { orderStatus: status },
      include: { itens: true }
    })
    return {
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      itens: p.itens.map(i => ({
        ...i,
        precoSnapshot: Number(i.precoSnapshot)
      }))
    }
  }

  async updateItems(pedidoId: string, newItensConfig: Prisma.ItemPedidoCreateWithoutPedidoInput[], calcTotalBruto: Prisma.Decimal) {
    // Apaga os itens atuais e recria para simular update da sacola (como na fase ABERTO o pedido ainda está em aberto)
    await prisma.$transaction([
      prisma.itemPedido.deleteMany({ where: { pedidoId } }),
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          totalBruto: calcTotalBruto,
          totalFinal: calcTotalBruto,
          itens: {
            create: newItensConfig
          }
        }
      })
    ])

    return this.findById(pedidoId)
  }
}
