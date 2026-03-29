import { auth } from '@/lib/auth-instance'
import { DashboardService } from '@/services/dashboard.service'
import { NextResponse } from 'next/server'

const service = new DashboardService()

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') || 'hoje'

  try {
    switch (params.action) {
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
  } catch (error) {
    console.error(`Erro no dashboard action ${params.action}:`, error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
