import { TurnoService } from '@/services/turno.service'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/with-security'

const service = new TurnoService()

const confirmarFechamentoSchema = z.array(z.object({
  produtoId: z.string(),
  qtdFisica: z.number().int().min(0)
}))

export const GET = withSecurity(async (request, session) => {
  const url = new URL(request.url)
  const action = url.pathname.split('/').pop()

  if (action === 'status') {
    return NextResponse.json(await service.getStatus())
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}, { 
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 30, windowMs: 60 * 1000 }
})

export const POST = withSecurity(async (request, session) => {
  const url = new URL(request.url)
  const action = url.pathname.split('/').pop()

  switch (action) {
    case 'iniciar-fechamento':
      return NextResponse.json(await service.iniciarFechamento(session.user.id))
    
    case 'confirmar-fechamento': {
      const body = await request.json()
      const contagens = confirmarFechamentoSchema.parse(body)
      return NextResponse.json(await service.confirmarFechamento(session.user.id, contagens))
    }

    case 'cancelar-fechamento':
      return NextResponse.json(await service.cancelarFechamento())

    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
}, { 
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 10, windowMs: 60 * 1000 }
})
