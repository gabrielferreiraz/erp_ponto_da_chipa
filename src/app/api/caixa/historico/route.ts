import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withSecurity(async (req) => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const pedidos = await prisma.pedido.findMany({
    where: {
      orderStatus: 'PAGO',
      pagoEm: { gte: hoje }
    },
    include: {
      atendente: { select: { nome: true } },
      itens: {
        where: { status: 'ATIVO' },
        select: {
          id: true,
          nomeSnapshot: true,
          precoSnapshot: true,
          quantidade: true
        }
      }
    },
    orderBy: { pagoEm: 'desc' }
  })

  return NextResponse.json(
    pedidos.map(p => ({
      ...p,
      totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
      totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
      totalCancelado: p.totalCancelado ? Number(p.totalCancelado) : 0,
      itens: p.itens.map(i => ({ ...i, precoSnapshot: Number(i.precoSnapshot) }))
    }))
  )
}, {
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 60, windowMs: 60 * 1000 }
})
