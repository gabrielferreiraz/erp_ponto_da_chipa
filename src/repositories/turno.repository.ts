import { prisma } from '@/lib/prisma'
import { ShiftStatus, OrderStatus } from '@prisma/client'

export class TurnoRepository {
  async findActiveShift() {
    return await prisma.shiftClosing.findFirst({
      where: { status: ShiftStatus.EM_ANDAMENTO },
      include: {
        usuario: { select: { nome: true } }
      }
    })
  }

  async countPedidosAguardandoCobranca() {
    return await prisma.pedido.count({
      where: { orderStatus: OrderStatus.AGUARDANDO_COBRANCA }
    })
  }

  async createShift(usuarioId: string) {
    return await prisma.shiftClosing.create({
      data: {
        usuarioId,
        status: ShiftStatus.EM_ANDAMENTO
      }
    })
  }

  async cancelShift(shiftId: string) {
    return await prisma.shiftClosing.delete({
      where: { id: shiftId }
    })
  }

  async finalizeShift(shiftId: string) {
    return await prisma.shiftClosing.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.FINALIZADO,
        finalizadoEm: new Date()
      }
    })
  }

  async createShiftItems(shiftId: string, items: any[], tx: any) {
    return await tx.shiftClosingItem.createMany({
      data: items.map(item => ({
        shiftClosingId: shiftId,
        produtoId: item.produtoId,
        qtdSistema: item.qtdSistema,
        qtdFisica: item.qtdFisica,
        diferenca: item.diferenca,
        motivo: item.diferenca !== 0 ? 'Divergência de fechamento' : null
      }))
    })
  }
}
