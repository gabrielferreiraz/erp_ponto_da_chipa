import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'

export const POST = withSecurity(async (req, session) => {
  // TODO: Implementar operações de caixa na Fase 2
  return NextResponse.json({ message: 'Operações de caixa — Fase 2' }, { status: 501 })
}, { 
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 10, windowMs: 60 * 1000 }
})
