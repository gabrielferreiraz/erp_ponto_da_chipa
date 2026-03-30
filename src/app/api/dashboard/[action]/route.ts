import { DashboardService } from '@/services/dashboard.service'
import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { commonParams } from '@/lib/validations/common'

const service = new DashboardService()

export const GET = withSecurity(async (request, session) => {
  const url = new URL(request.url)
  const action = url.pathname.split('/').pop()
  
  const searchParams = url.searchParams
  const periodoParsed = commonParams.periodo.safeParse(searchParams.get('periodo'))
  const periodo = periodoParsed.success ? periodoParsed.data : 'hoje'

  switch (action) {
    case 'resumo':
      return NextResponse.json(await service.getResumo(periodo))
    case 'ranking-produtos':
      return NextResponse.json(await service.getRankingProdutos(periodo))
    case 'vendas-por-dia':
      return NextResponse.json(await service.getVendasPorDia())
    case 'cancelamentos':
      return NextResponse.json(await service.getCancelamentos(periodo))
    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
}, { 
  roles: ['ADMIN'],
  rateLimit: { limit: 60, windowMs: 60 * 1000 }
})
