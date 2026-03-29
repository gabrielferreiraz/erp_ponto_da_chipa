import { prisma } from '@/lib/prisma'
import { TurnoRepository } from '@/repositories/turno.repository'
import { turnoState } from '@/lib/turno-state'
import { TipoMovimentacao, OrigemEstoque } from '@prisma/client'

export class TurnoService {
  private repository = new TurnoRepository()

  async getStatus() {
    const isClosingShift = turnoState.get()
    const activeShift = await this.repository.findActiveShift()
    const pedidosPendentes = await this.repository.countPedidosAguardandoCobranca()

    return {
      isClosingShift,
      pedidosPendentes,
      shiftClosingId: activeShift?.id || null,
      usuarioIniciou: activeShift?.usuario?.nome || null
    }
  }

  async iniciarFechamento(usuarioId: string) {
    const status = await this.getStatus()
    
    if (status.pedidosPendentes > 0) {
      throw new Error(`Não é possível iniciar o fechamento: existem ${status.pedidosPendentes} pedidos aguardando cobrança.`)
    }

    if (status.isClosingShift) {
      throw new Error('Já existe um fechamento em andamento.')
    }

    const shift = await this.repository.createShift(usuarioId)
    turnoState.set(true)
    
    return shift
  }

  async confirmarFechamento(usuarioId: string, contagens: { produtoId: string, qtdFisica: number }[]) {
    const status = await this.getStatus()
    if (!status.shiftClosingId) {
      throw new Error('Nenhum fechamento em andamento para confirmar.')
    }

    return await prisma.$transaction(async (tx) => {
      const itemsToRecord = []

      for (const contagem of contagens) {
        // SELECT FOR UPDATE para travar o produto
        const produto = await tx.$queryRaw<any[]>`
          SELECT id, "qtdVisor", disponivel FROM produtos 
          WHERE id = ${contagem.produtoId} 
          FOR UPDATE
        `

        if (!produto[0] || !produto[0].disponivel) continue

        const qtdSistema = produto[0].qtdVisor
        const diferenca = contagem.qtdFisica - qtdSistema

        itemsToRecord.push({
          produtoId: contagem.produtoId,
          qtdSistema,
          qtdFisica: contagem.qtdFisica,
          diferenca
        })

        // Se houver divergência, cria movimentação de AJUSTE
        if (diferenca !== 0) {
          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: contagem.produtoId,
              tipo: TipoMovimentacao.AJUSTE,
              origem: OrigemEstoque.VISOR,
              quantidade: diferenca,
              usuarioId,
              observacao: `Ajuste automático de fechamento de turno (Dif: ${diferenca})`
            }
          })

          // Atualiza qtdVisor com o valor físico real
          await tx.produto.update({
            where: { id: contagem.produtoId },
            data: { qtdVisor: contagem.qtdFisica }
          })
        }
      }

      // Salva os itens do fechamento
      await this.repository.createShiftItems(status.shiftClosingId!, itemsToRecord, tx)

      // Finaliza o ShiftClosing
      await tx.shiftClosing.update({
        where: { id: status.shiftClosingId! },
        data: {
          status: 'FINALIZADO',
          finalizadoEm: new Date()
        }
      })

      // Reseta flag global
      turnoState.set(false)
      
      return { success: true }
    })
  }

  async cancelarFechamento() {
    const status = await this.getStatus()
    if (status.shiftClosingId) {
      await this.repository.cancelShift(status.shiftClosingId)
    }
    turnoState.set(false)
    return { success: true }
  }
}
