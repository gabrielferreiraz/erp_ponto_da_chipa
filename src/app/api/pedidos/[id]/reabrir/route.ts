import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { prisma } from '@/lib/prisma'

export const POST = withSecurity(async (req, session, { params }) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    select: { id: true, orderStatus: true, caixaId: true }
  })

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  if (pedido.orderStatus !== 'PAGO') {
    return NextResponse.json(
      { error: 'Somente pedidos pagos podem ser reabertos.' },
      { status: 409 }
    )
  }

  const atualizado = await prisma.pedido.update({
    where: { id: params.id },
    data: {
      orderStatus: 'AGUARDANDO_COBRANCA',
      paymentStatus: 'PENDENTE',
      formaPagamento: null,
      pagoEm: null,
      caixaId: null,
      idempotencyKey: null,
    }
  })

  return NextResponse.json(atualizado)
}, {
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 10, windowMs: 60 * 1000 }
})
