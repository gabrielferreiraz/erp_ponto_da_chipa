import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { pagamentoSchema } from '@/lib/validations/caixa'
import { commonParams } from '@/lib/validations/common'
import { CaixaService } from '@/services/caixa.service'
import { sseEmitter } from '@/lib/sse-emitter'

const caixaService = new CaixaService()

export const POST = withSecurity(async (req, session, { params }) => {
  // Hardening do ID
  const idParsed = commonParams.id.safeParse(params.id)
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = pagamentoSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { formaPagamento, idempotencyKey } = parsed.data

  const pedidoPago = await caixaService.pagarPedido({
    pedidoId: idParsed.data,
    caixaId: session.user.id,
    formaPagamento,
    idempotencyKey
  })

  // Despacha sinal SSE para todos os desktops do caixa recarregarem de forma atômica
  sseEmitter.emit('pedido_pago')

  return NextResponse.json(pedidoPago, { status: 200 })
}, { 
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 20, windowMs: 60 * 1000 }
})
