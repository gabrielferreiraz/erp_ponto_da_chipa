import { DashboardRepository } from '@/repositories/dashboard.repository'
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'

export class DashboardService {
  private repository: DashboardRepository

  constructor() {
    this.repository = new DashboardRepository()
  }

  private parseDates(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const hoje = new Date()
    let dataInicio = startOfDay(hoje)
    let dataFim = endOfDay(hoje)

    if (inicio && fim) {
      dataInicio = startOfDay(parseISO(inicio))
      dataFim = endOfDay(parseISO(fim))
    } else {
      switch (periodo) {
        case 'ontem':
          dataInicio = startOfDay(subDays(hoje, 1))
          dataFim = endOfDay(subDays(hoje, 1))
          break
        case 'semana':
          dataInicio = startOfWeek(hoje, { weekStartsOn: 0 })
          dataFim = endOfWeek(hoje, { weekStartsOn: 0 })
          break
        case 'mes':
          dataInicio = startOfMonth(hoje)
          dataFim = endOfMonth(hoje)
          break
        case 'ano':
          dataInicio = startOfYear(hoje)
          dataFim = endOfYear(hoje)
          break
        case '7dias':
          dataInicio = startOfDay(subDays(hoje, 6))
          break
        case '30dias':
          dataInicio = startOfDay(subDays(hoje, 29))
          break
        case 'hoje':
        default:
          dataInicio = startOfDay(hoje)
          dataFim = endOfDay(hoje)
      }
    }

    return { dataInicio, dataFim }
  }

  async getKPIs(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getKPIs(dataInicio, dataFim)
  }

  async getFaturamentoSerie(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getFaturamentoSerie(dataInicio, dataFim)
  }

  async getRankingProdutos(inicio?: string | null, fim?: string | null, periodo?: string | null, categoriaId?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getRankingProdutos(dataInicio, dataFim, categoriaId || undefined)
  }

  async getPorDiaSemana(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getPorDiaSemana(dataInicio, dataFim)
  }

  async getFormasPagamento(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getFormasPagamento(dataInicio, dataFim)
  }

  async getLocalVsViagem(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getLocalVsViagem(dataInicio, dataFim)
  }

  async getCancelamentos(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getCancelamentos(dataInicio, dataFim)
  }

  async getMesas(inicio?: string | null, fim?: string | null, periodo?: string | null) {
    const { dataInicio, dataFim } = this.parseDates(inicio, fim, periodo)
    return await this.repository.getMesas(dataInicio, dataFim)
  }
}
