import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface DashboardKPIs {
  totalFaturado: number
  pedidosPagos: number
  ticketMedio: number
  totalCancelado: number
  valorCancelado: number
  percentualLocal: number
  percentualViagem: number
  horaPico: number | null
}

export interface FaturamentoSerie {
  periodo: string
  total: number
}

export interface RankingProduto {
  id: string
  nome: string
  categoria: string
  quantidade: number
  receita: number
  ticketMedio: number
  taxaCancelamento: number
}

export interface VendasDiaSemana {
  dia: string
  total: number
}

export interface FormaPagamentoData {
  forma: string
  valor: number
  quantidade: number
  percentual: number
}

export interface LocalVsViagemData {
  periodo: string
  local: number
  viagem: number
}

export interface CancelamentoItem {
  produto: string
  quantidade: number
  valorPerdido: number
  motivoPrincipal: string
}

export interface MesaAtiva {
  numero: number
  pedidos: number
  faturamento: number
  ticketMedio: number
}

export class DashboardRepository {
  async getKPIs(inicio: Date, fim: Date): Promise<DashboardKPIs> {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM("totalFinal"), 0)::FLOAT as "totalFaturado",
        COUNT(*)::INT as "pedidosPagos",
        COALESCE(SUM("totalCancelado"), 0)::FLOAT as "valorCancelado",
        CASE 
          WHEN COUNT(CASE WHEN "totalFinal" > 0 THEN 1 END) > 0 
          THEN COALESCE(SUM("totalFinal"), 0)::FLOAT / COUNT(CASE WHEN "totalFinal" > 0 THEN 1 END)::FLOAT
          ELSE 0 
        END as "ticketMedio",
        COUNT(CASE WHEN tipo = 'LOCAL' THEN 1 END)::FLOAT as "qtdLocal",
        COUNT(CASE WHEN tipo = 'VIAGEM' THEN 1 END)::FLOAT as "qtdViagem",
        (SELECT COUNT(*)::INT FROM itens_pedido ip 
         JOIN pedidos p2 ON ip."pedidoId" = p2.id 
         WHERE ip.status = 'CANCELADO' AND p2."criadoEm" BETWEEN ${inicio} AND ${fim}) as "totalCancelado"
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO'
      AND "criadoEm" BETWEEN ${inicio} AND ${fim}
    `

    const peakHourResult = await prisma.$queryRaw<any[]>`
      SELECT EXTRACT(HOUR FROM "criadoEm")::INT as hora, COUNT(*)::INT as qtd
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO' AND "criadoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY hora ORDER BY qtd DESC LIMIT 1
    `

    const s = stats[0]
    const total = (s.qtdLocal + s.qtdViagem) || 1
    
    return {
      totalFaturado: s.totalFaturado,
      pedidosPagos: s.pedidosPagos,
      ticketMedio: s.ticketMedio,
      totalCancelado: s.totalCancelado,
      valorCancelado: s.valorCancelado,
      percentualLocal: (s.qtdLocal / total) * 100,
      percentualViagem: (s.qtdViagem / total) * 100,
      horaPico: peakHourResult[0]?.hora ?? null
    }
  }

  async getFaturamentoSerie(inicio: Date, fim: Date): Promise<FaturamentoSerie[]> {
    const diffDays = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    
    let interval = '1 day'
    let trunc = 'day'
    let format = 'YYYY-MM-DD'

    if (diffDays <= 1) {
      interval = '1 hour'
      trunc = 'hour'
      format = 'HH24:00'
    } else if (diffDays <= 7) {
      interval = '1 hour'
      trunc = 'hour'
      format = 'DD/MM HH24h'
    } else if (diffDays > 365) {
      interval = '1 month'
      trunc = 'month'
      format = 'MM/YYYY'
    }

    return await prisma.$queryRaw<FaturamentoSerie[]>`
      WITH serie AS (
        SELECT generate_series(${inicio}::timestamp, ${fim}::timestamp, ${interval}::interval) as p
      )
      SELECT 
        to_char(s.p, ${format}) as periodo,
        COALESCE(SUM(p."totalFinal"), 0)::FLOAT as total
      FROM serie s
      LEFT JOIN pedidos p ON date_trunc(${trunc}, p."criadoEm") = date_trunc(${trunc}, s.p) 
                         AND p."paymentStatus" = 'PAGO'
      GROUP BY s.p
      ORDER BY s.p ASC
    `
  }

  async getRankingProdutos(inicio: Date, fim: Date, categoriaId?: string): Promise<RankingProduto[]> {
    const categoriaFilter = categoriaId ? Prisma.sql`AND p."categoriaId" = ${categoriaId}` : Prisma.empty

    return await prisma.$queryRaw<RankingProduto[]>`
      SELECT 
        p.id,
        p.nome,
        c.nome as categoria,
        SUM(ip.quantidade)::INT as quantidade,
        SUM(ip.quantidade * ip."precoSnapshot")::FLOAT as receita,
        AVG(ip."precoSnapshot")::FLOAT as "ticketMedio",
        (COUNT(CASE WHEN ip.status = 'CANCELADO' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0)::FLOAT) * 100 as "taxaCancelamento"
      FROM itens_pedido ip
      JOIN produtos p ON ip."produtoId" = p.id
      JOIN categorias c ON p."categoriaId" = c.id
      JOIN pedidos ped ON ip."pedidoId" = ped.id
      WHERE ped."criadoEm" BETWEEN ${inicio} AND ${fim}
      AND ped."paymentStatus" = 'PAGO'
      ${categoriaFilter}
      GROUP BY p.id, p.nome, c.nome
      ORDER BY quantidade DESC
      LIMIT 10
    `
  }

  async getPorDiaSemana(inicio: Date, fim: Date): Promise<VendasDiaSemana[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(DOW FROM "criadoEm")::INT as dia_num,
        COALESCE(SUM("totalFinal"), 0)::FLOAT as total
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO' AND "criadoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY dia_num
      ORDER BY dia_num ASC
    `

    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return dias.map((nome, i) => ({
      dia: nome,
      total: result.find(r => r.dia_num === i)?.total || 0
    }))
  }

  async getFormasPagamento(inicio: Date, fim: Date): Promise<FormaPagamentoData[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        "formaPagamento" as forma,
        SUM("totalFinal")::FLOAT as valor,
        COUNT(*)::INT as quantidade
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO' AND "criadoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY forma
    `

    const totalValor = result.reduce((acc, r) => acc + r.valor, 0) || 1

    return result.map(r => ({
      ...r,
      percentual: (r.valor / totalValor) * 100
    }))
  }

  async getLocalVsViagem(inicio: Date, fim: Date): Promise<LocalVsViagemData[]> {
    return await prisma.$queryRaw<LocalVsViagemData[]>`
      SELECT 
        to_char("criadoEm", 'DD/MM') as periodo,
        SUM(CASE WHEN tipo = 'LOCAL' THEN "totalFinal" ELSE 0 END)::FLOAT as local,
        SUM(CASE WHEN tipo = 'VIAGEM' THEN "totalFinal" ELSE 0 END)::FLOAT as viagem
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO' AND "criadoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY periodo, date_trunc('day', "criadoEm")
      ORDER BY date_trunc('day', "criadoEm") ASC
    `
  }

  async getCancelamentos(inicio: Date, fim: Date): Promise<CancelamentoItem[]> {
    return await prisma.$queryRaw<CancelamentoItem[]>`
      SELECT 
        p.nome as produto,
        SUM(ip.quantidade)::INT as quantidade,
        SUM(ip.quantidade * ip."precoSnapshot")::FLOAT as "valorPerdido",
        MODE() WITHIN GROUP (ORDER BY ip."motivoCancelamento") as "motivoPrincipal"
      FROM itens_pedido ip
      JOIN produtos p ON ip."produtoId" = p.id
      WHERE ip.status = 'CANCELADO' AND ip."canceladoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY p.nome
      ORDER BY "valorPerdido" DESC
    `
  }

  async getMesas(inicio: Date, fim: Date): Promise<MesaAtiva[]> {
    return await prisma.$queryRaw<MesaAtiva[]>`
      SELECT 
        m.numero,
        COUNT(p.id)::INT as pedidos,
        SUM(p."totalFinal")::FLOAT as faturamento,
        AVG(p."totalFinal")::FLOAT as "ticketMedio"
      FROM pedidos p
      JOIN mesas m ON p."mesaId" = m.id
      WHERE p."paymentStatus" = 'PAGO' AND p."criadoEm" BETWEEN ${inicio} AND ${fim}
      GROUP BY m.numero
      ORDER BY faturamento DESC
    `
  }
}
