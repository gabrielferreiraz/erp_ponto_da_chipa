import { CaixaMovimentacaoService } from '@/services/caixa-movimentacao.service'
import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { z } from 'zod'

const service = new CaixaMovimentacaoService()

const schema = z.object({
  tipo: z.enum(['SANGRIA', 'SUPRIMENTO', 'FUNDO_INICIAL']),
  valor: z.number().positive(),
  observacao: z.string().optional()
})

export const GET = withSecurity(async () => {
  return NextResponse.json(await service.getToday())
}, { roles: ['ADMIN', 'CAIXA'] })

export const POST = withSecurity(async (request, session) => {
  const body = await request.json()
  const data = schema.parse(body)
  
  const mov = await service.register({
    ...data,
    usuarioId: session.user.id
  })

  return NextResponse.json(mov)
}, { roles: ['ADMIN', 'CAIXA'] })
