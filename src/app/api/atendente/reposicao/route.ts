import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { EstoqueService } from '@/services/estoque.service'
import { z } from 'zod'

const schema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.number().int().positive()
})

const estoqueService = new EstoqueService()

export const POST = withSecurity(async (request, session) => {
  const body = await request.json()
  const { produtoId, quantidade } = schema.parse(body)

  await estoqueService.reporVisor(produtoId, quantidade, session.user.id)

  return NextResponse.json({ success: true })
}, {
  roles: ['ADMIN', 'ATENDENTE'],
  rateLimit: { limit: 30, windowMs: 60 * 1000 }
})
