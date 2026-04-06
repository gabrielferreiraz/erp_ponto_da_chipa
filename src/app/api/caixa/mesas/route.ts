import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withSecurity(async () => {
  const mesas = await prisma.mesa.findMany({
    where: { ativa: true },
    include: {
      pedidos: {
        where: {
          orderStatus: { in: ['ABERTO', 'AGUARDANDO_COBRANCA'] }
        },
        include: {
          mesa: true,
          atendente: { select: { nome: true } },
          itens: {
            where: { status: 'ATIVO' },
            include: {
              produto: { select: { imagemUrl: true, qtdVisor: true } }
            }
          }
        },
        orderBy: { criadoEm: 'asc' }
      }
    },
    orderBy: { numero: 'asc' }
  })

  // Only return mesas that have active orders
  const mesasComPedido = mesas
    .filter(m => m.pedidos.length > 0)
    .map(m => ({
      ...m,
      pedidos: m.pedidos.map(p => ({
        ...p,
        totalBruto: p.totalBruto ? Number(p.totalBruto) : 0,
        totalFinal: p.totalFinal ? Number(p.totalFinal) : 0,
        totalCancelado: p.totalCancelado ? Number(p.totalCancelado) : 0,
        itens: p.itens.map(i => ({
          ...i,
          precoSnapshot: Number(i.precoSnapshot)
        }))
      }))
    }))

  return NextResponse.json(mesasComPedido)
}, {
  roles: ['ADMIN', 'CAIXA'],
  rateLimit: { limit: 60, windowMs: 60 * 1000 }
})
