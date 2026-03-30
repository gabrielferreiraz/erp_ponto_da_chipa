import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { createPedidoSchema } from '@/lib/validations/pedido'
import { PedidoService } from '@/services/pedido.service'

const pedidoService = new PedidoService()

export const GET = withSecurity(async (req, session) => {
  const pedidos = await pedidoService.getPedidosAtendente(session.user.id)
  return NextResponse.json(pedidos)
}, { 
  roles: ['ADMIN', 'ATENDENTE'],
  rateLimit: { limit: 100, windowMs: 60 * 1000 } // 100 reqs/min
})

export const POST = withSecurity(async (req, session) => {
  const body = await req.json()
  const parsed = createPedidoSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Campos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { tipo, mesaId, observacao, itens } = parsed.data

  const novoPedido = await pedidoService.create({
    tipo,
    mesaId,
    observacao,
    itens,
    atendenteId: session.user.id
  })

  return NextResponse.json(novoPedido, { status: 201 })
}, { 
  roles: ['ADMIN', 'ATENDENTE'],
  rateLimit: { limit: 20, windowMs: 60 * 1000 } // 20 pedidos/min (prevenção de spam)
})
