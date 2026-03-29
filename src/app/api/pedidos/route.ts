import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { createPedidoSchema } from '@/lib/validations/pedido'
import { PedidoService } from '@/services/pedido.service'

const pedidoService = new PedidoService()

export async function GET(req: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'ATENDENTE'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const pedidos = await pedidoService.getPedidosAtendente(session.user.id)
    return NextResponse.json(pedidos)
  } catch (error: any) {
    console.error('[GET_PEDIDOS]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'ATENDENTE'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
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
  } catch (error: any) {
    console.error('[POST_PEDIDOS]', error)
    
    if (error.message.includes('BAD_REQUEST')) {
      return NextResponse.json({ error: error.message.replace('BAD_REQUEST: ', '') }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
