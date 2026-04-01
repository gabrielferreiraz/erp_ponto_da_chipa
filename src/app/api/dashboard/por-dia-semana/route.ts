import { DashboardService } from '@/services/dashboard.service'
import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'

const service = new DashboardService()

function getParams(url: URL) {
  return {
    inicio: url.searchParams.get('inicio'),
    fim: url.searchParams.get('fim'),
    periodo: url.searchParams.get('periodo')
  }
}

export const GET = withSecurity(async (request) => {
  const { inicio, fim, periodo } = getParams(new URL(request.url))
  return NextResponse.json(await service.getPorDiaSemana(inicio, fim, periodo))
}, { roles: ['ADMIN'] })
