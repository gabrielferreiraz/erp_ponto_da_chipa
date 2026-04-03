import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { cancelarItemSchema } from '@/lib/validations/caixa'
import { commonParams } from '@/lib/validations/common'
import { CaixaService } from '@/services/caixa.service'

const caixaService = new CaixaService()

export const PATCH = withSecurity(async (req, session, { params }) => {
  // Hardening do ID
  const idParsed = commonParams.id.safeParse(params.id)
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = cancelarItemSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { itemId, motivoCancelamento, quantidadeCancelada } = parsed.data

  await caixaService.cancelarItem(itemId, session.user.id, motivoCancelamento, quantidadeCancelada)

  return NextResponse.json({ success: true, message: 'Item estornado.' })
}, { 
  roles: ['ADMIN', 'CAIXA', 'ATENDENTE'],
  rateLimit: { limit: 20, windowMs: 60 * 1000 }
})

