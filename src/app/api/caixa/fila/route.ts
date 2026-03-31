import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { CaixaService } from '@/services/caixa.service'

const caixaService = new CaixaService()

export const dynamic = 'force-dynamic'

export const GET = withSecurity(async (req, session) => {
  const pedidos = await caixaService.getFila()
  return NextResponse.json(pedidos)
}, { 
  roles: ['ADMIN', 'CAIXA', 'ATENDENTE'],
  rateLimit: { limit: 120, windowMs: 60 * 1000 } // Aumentado um pouco para acomodar 2 papéis
})
