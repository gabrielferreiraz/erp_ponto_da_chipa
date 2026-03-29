import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { EstoqueService } from '@/services/estoque.service'

const estoqueService = new EstoqueService()
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const dashboardData = await estoqueService.getDashboardEstoque()
    return NextResponse.json(dashboardData)
  } catch (error: any) {
    console.error('[GET_ESTOQUE_DASHBOARD]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados do estoque' }, { status: 500 })
  }
}
