import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withSecurity(async () => {
  const produtos = await prisma.produto.findMany({
    where: { disponivel: true },
    select: {
      id: true,
      nome: true,
      qtdVisor: true,
      qtdEstoque: true,
      estoqueMinimo: true,
      imagemUrl: true,
      categoria: { select: { nome: true } }
    },
    orderBy: [
      { qtdVisor: 'asc' }, // críticos primeiro
      { nome: 'asc' }
    ]
  })

  return NextResponse.json(
    produtos.map(p => ({
      ...p,
      categoria: p.categoria.nome,
      status: p.qtdVisor === 0 ? 'CRITICO' : p.qtdVisor <= p.estoqueMinimo ? 'ALERTA' : 'OK',
      imagemUrl: p.imagemUrl ?? null
    }))
  )
}, {
  roles: ['ADMIN', 'ATENDENTE'],
  rateLimit: { limit: 60, windowMs: 60 * 1000 }
})
