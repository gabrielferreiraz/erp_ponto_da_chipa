import { prisma } from '@/lib/prisma'

export class CaixaRepository {
  async fetchFila() {
    const pedidos = await prisma.pedido.findMany({
      where: {
        orderStatus: 'AGUARDANDO_COBRANCA'
      },
      include: {
        mesa: true,
        atendente: { select: { nome: true } },
        itens: {
          where: { status: 'ATIVO' },
          include: {
            produto: {
              select: { imagemUrl: true, qtdVisor: true }
            }
          }
        }
      },
      orderBy: {
        criadoEm: 'asc' // Mais antigo primeiro conforme regra de negócio
      }
    })

    return pedidos.map(p => ({
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      totalCancelado: p.totalCancelado ? Number(p.totalCancelado) : 0,
      itens: p.itens.map(i => ({
        ...i,
        precoSnapshot: Number(i.precoSnapshot)
      }))
    }))
  }
}
