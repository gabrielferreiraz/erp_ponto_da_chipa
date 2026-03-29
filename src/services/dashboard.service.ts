import { DashboardRepository } from '@/repositories/dashboard.repository'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export class DashboardService {
  private repository: DashboardRepository

  constructor() {
    this.repository = new DashboardRepository()
  }

  private getIntervalo(periodo: string) {
    const hoje = new Date()
    let dataInicio = startOfDay(hoje)
    let dataFim = endOfDay(hoje)

    switch (periodo) {
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

    return { dataInicio, dataFim }
  }

  async getResumo(periodo: string = 'hoje') {
    const { dataInicio, dataFim } = this.getIntervalo(periodo)
    return await this.repository.getResumo(dataInicio, dataFim)
  }

  async getRankingProdutos(periodo: string = 'hoje') {
    const { dataInicio, dataFim } = this.getIntervalo(periodo)
    return await this.repository.getRankingProdutos(dataInicio, dataFim)
  }

  async getVendasPorDia() {
    const hoje = new Date()
    const dataInicio = startOfDay(subDays(hoje, 29))
    const dataFim = endOfDay(hoje)
    return await this.repository.getVendasPorDia(dataInicio, dataFim)
  }

  async getCancelamentos(periodo: string = 'hoje') {
    const { dataInicio, dataFim } = this.getIntervalo(periodo)
    return await this.repository.getCancelamentos(dataInicio, dataFim)
  }
}
