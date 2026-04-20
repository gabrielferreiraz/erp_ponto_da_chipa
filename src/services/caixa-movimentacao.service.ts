import { prisma } from '@/lib/prisma'
import { TipoMovimentacaoCaixa } from '@prisma/client'

export class CaixaMovimentacaoService {
  async register(data: {
    tipo: TipoMovimentacaoCaixa,
    valor: number,
    observacao?: string,
    usuarioId: string
  }) {
    if (data.valor <= 0) throw new Error('Valor deve ser maior que zero')
    
    return await prisma.caixaMovimentacao.create({
      data: {
        tipo: data.tipo,
        valor: data.valor,
        observacao: data.observacao,
        usuarioId: data.usuarioId
      }
    })
  }

  async getToday() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return await prisma.caixaMovimentacao.findMany({
      where: { criadoEm: { gte: hoje } },
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { nome: true } } }
    })
  }
}
