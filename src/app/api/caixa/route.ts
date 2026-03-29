import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'CAIXA'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // TODO: Implementar operações de caixa na Fase 2
  return NextResponse.json({ message: 'Operações de caixa — Fase 2' }, { status: 501 })
}
