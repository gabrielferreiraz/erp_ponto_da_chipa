import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { CaixaService } from '@/services/caixa.service'

const caixaService = new CaixaService()

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'CAIXA'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const pedidos = await caixaService.getFila()
    return NextResponse.json(pedidos)
  } catch (error: any) {
    console.error('[GET_FILA_CAIXA]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
