import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { pagamentoSchema } from '@/lib/validations/caixa'
import { CaixaService } from '@/services/caixa.service'
import { sseEmitter } from '@/lib/sse-emitter'

const caixaService = new CaixaService()

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'CAIXA'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = pagamentoSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { formaPagamento, idempotencyKey } = parsed.data

    const pedidoPago = await caixaService.pagarPedido({
      pedidoId: params.id,
      caixaId: session.user.id,
      formaPagamento,
      idempotencyKey
    })

    // Despacha sinal SSE para todos os desktops do caixa recarregarem de forma atômica
    sseEmitter.emit('pedido_pago')

    return NextResponse.json(pedidoPago, { status: 200 })
  } catch (error: any) {
    console.error('[POST_CAIXA_PAGAR]', error)
    
    if (error.message.includes('NOT_FOUND')) {
       return NextResponse.json({ error: error.message.replace('NOT_FOUND: ', '') }, { status: 404 })
    }
    if (error.message.includes('CONFLICT')) {
       return NextResponse.json({ error: error.message.replace('CONFLICT: ', '') }, { status: 409 })
    }
    if (error.message.includes('BAD_REQUEST')) {
       return NextResponse.json({ error: error.message.replace('BAD_REQUEST: ', '') }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno ao processar pagamento.' }, { status: 500 })
  }
}
