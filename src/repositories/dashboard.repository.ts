import { prisma } from '@/lib/prisma'

export interface ResumoKPI {
  totalVendido: number
  quantidadePedidos: number
  ticketMedio: number
  totalCancelado: number
}

export interface RankingProduto {
  id: string
  nome: string
  quantidade: number
  total: number
}

export interface VendaPorDia {
  data: string
  total: number
}

export interface CancelamentoInfo {
  totalPerdaFinanceira: number
  taxaCancelamento: number
  motivosFrequentes: { motivo: string; quantidade: number }[]
  produtosMaisCancelados: { nome: string; quantidade: number }[]
}

interface ResumoQueryResult {
  totalVendido: number
  quantidadePedidos: number
  totalCancelado: number
  ticketMedio: number
}

interface CancelamentoResumoResult {
  totalPerdaFinanceira: number
  totalItensCancelados: number
}

interface MotivoCancelamentoResult {
  motivo: string
  quantidade: number
}

interface ProdutoCancelamentoResult {
  nome: string
  quantidade: number
}

export class DashboardRepository {
  async getResumo(dataInicio: Date, dataFim: Date): Promise<ResumoKPI> {
    const result = await prisma.$queryRaw<ResumoQueryResult[]>`
      SELECT 
        COALESCE(SUM("totalFinal"), 0)::FLOAT as "totalVendido",
        COUNT(*)::INT as "quantidadePedidos",
        COALESCE(SUM("totalCancelado"), 0)::FLOAT as "totalCancelado",
        CASE 
          WHEN COUNT(CASE WHEN "totalFinal" > 0 THEN 1 END) > 0 
          THEN COALESCE(SUM("totalFinal"), 0)::FLOAT / COUNT(CASE WHEN "totalFinal" > 0 THEN 1 END)::FLOAT
          ELSE 0 
        END as "ticketMedio"
      FROM pedidos
      WHERE "paymentStatus" = 'PAGO'
      AND "criadoEm" >= ${dataInicio}
      AND "criadoEm" <= ${dataFim}
    `

    return {
      totalVendido: result[0].totalVendido,
      quantidadePedidos: result[0].quantidadePedidos,
      ticketMedio: result[0].ticketMedio,
      totalCancelado: result[0].totalCancelado
    }
  }

  async getRankingProdutos(dataInicio: Date, dataFim: Date, limit: number = 10): Promise<RankingProduto[]> {
    return await prisma.$queryRaw<RankingProduto[]>`
      SELECT 
        p.id,
        p.nome,
        SUM(ip.quantidade)::INT as quantidade,
        SUM(ip.quantidade * ip."precoSnapshot")::FLOAT as total
      FROM itens_pedido ip
      JOIN produtos p ON ip."produtoId" = p.id
      JOIN pedidos ped ON ip."pedidoId" = ped.id
      WHERE ped."paymentStatus" = 'PAGO'
      AND ip.status = 'ATIVO'
      AND ped."criadoEm" >= ${dataInicio}
      AND ped."criadoEm" <= ${dataFim}
      GROUP BY p.id, p.nome
      ORDER BY quantidade DESC
      LIMIT ${limit}
    `
  }

  async getVendasPorDia(dataInicio: Date, dataFim: Date): Promise<VendaPorDia[]> {
    return await prisma.$queryRaw<VendaPorDia[]>`
      WITH dias AS (
        SELECT generate_series(
          ${dataInicio}::timestamp, 
          ${dataFim}::timestamp, 
          '1 day'::interval
        )::date as dia
      )
      SELECT 
        d.dia::text as data,
        COALESCE(SUM(p."totalFinal"), 0)::FLOAT as total
      FROM dias d
      LEFT JOIN pedidos p ON p."criadoEm" >= d.dia 
                         AND p."criadoEm" < d.dia + '1 day'::interval 
                         AND p."paymentStatus" = 'PAGO'
      GROUP BY d.dia
      ORDER BY d.dia ASC
    `
  }

  async getCancelamentos(dataInicio: Date, dataFim: Date): Promise<CancelamentoInfo> {
    const resumo = await prisma.$queryRaw<CancelamentoResumoResult[]>`
      SELECT 
        COALESCE(SUM(quantidade * "precoSnapshot"), 0)::FLOAT as "totalPerdaFinanceira",
        COUNT(*)::INT as "totalItensCancelados"
      FROM itens_pedido
      WHERE status = 'CANCELADO'
      AND "canceladoEm" >= ${dataInicio}
      AND "canceladoEm" <= ${dataFim}
    `

    const totalItensAtivos = await prisma.itemPedido.count({
      where: {
        status: 'ATIVO',
        pedido: {
          criadoEm: {
            gte: dataInicio,
            lte: dataFim
          }
        }
      }
    })

    const motivos = await prisma.$queryRaw<MotivoCancelamentoResult[]>`
      SELECT 
        "motivoCancelamento" as motivo,
        COUNT(*)::INT as quantidade
      FROM itens_pedido
      WHERE status = 'CANCELADO'
      AND "canceladoEm" >= ${dataInicio}
      AND "canceladoEm" <= ${dataFim}
      AND "motivoCancelamento" IS NOT NULL
      GROUP BY "motivoCancelamento"
      ORDER BY quantidade DESC
      LIMIT 5
    `

    const produtos = await prisma.$queryRaw<ProdutoCancelamentoResult[]>`
      SELECT 
        p.nome,
        COUNT(*)::INT as quantidade
      FROM itens_pedido ip
      JOIN produtos p ON ip."produtoId" = p.id
      WHERE ip.status = 'CANCELADO'
      AND ip."canceladoEm" >= ${dataInicio}
      AND ip."canceladoEm" <= ${dataFim}
      GROUP BY p.nome
      ORDER BY quantidade DESC
      LIMIT 5
    `

    const totalItens = (resumo[0].totalItensCancelados || 0) + totalItensAtivos
    const taxaCancelamento = totalItens > 0 
      ? (resumo[0].totalItensCancelados / totalItens) * 100 
      : 0

    return {
      totalPerdaFinanceira: resumo[0].totalPerdaFinanceira,
      taxaCancelamento,
      motivosFrequentes: motivos,
      produtosMaisCancelados: produtos
    }
  }
}
