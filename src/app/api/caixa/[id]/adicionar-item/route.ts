import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { adicionarItemSchema } from '@/lib/validations/caixa'
import { commonParams } from '@/lib/validations/common'
import { CaixaService } from '@/services/caixa.service'

const caixaService = new CaixaService()

export const POST = withSecurity(async (req, session, { params }) => {
  // Hardening do ID
  const idParsed = commonParams.id.safeParse(params.id)
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = adicionarItemSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { produtoId, quantidade } = parsed.data

  try {
    await caixaService.adicionarItem(idParsed.data, produtoId, quantidade)
    return NextResponse.json({ success: true, message: 'Item adicionado.' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}, { 
  roles: ['ADMIN', 'CAIXA', 'ATENDENTE'],
  rateLimit: { limit: 20, windowMs: 60 * 1000 }
})
