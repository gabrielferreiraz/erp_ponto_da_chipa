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
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const produtoId = searchParams.get('produtoId') || undefined

    const historico = await estoqueService.getMovimentacoes(page, limit, produtoId)
    
    return NextResponse.json(historico)
  } catch (error: any) {
    console.error('[GET_MOVIMENTACOES_ESTOQUE]', error)
    return NextResponse.json({ error: 'Erro ao buscar o histórico de movimentações' }, { status: 500 })
  }
}
