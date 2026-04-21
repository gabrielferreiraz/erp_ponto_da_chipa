import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { updatePedidoSchema } from '@/lib/validations/pedido'
import { PedidoService } from '@/services/pedido.service'

const pedidoService = new PedidoService()

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!['ADMIN', 'ATENDENTE', 'CAIXA'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = updatePedidoSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Campos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { itens, mesaId, observacao } = parsed.data

    const pedidoEditado = await pedidoService.update({
      id: params.id,
      itens,
      mesaId,
      observacao,
      atendenteId: session.user.id
    })

    return NextResponse.json(pedidoEditado)
  } catch (error: any) {
    console.error('[PATCH_PEDIDO]', error)
    
    if (error.message.includes('BAD_REQUEST')) {
       return NextResponse.json({ error: error.message.replace('BAD_REQUEST: ', '') }, { status: 400 })
    }
    if (error.message.includes('NOT_FOUND')) {
       return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    if (error.message.includes('FORBIDDEN')) {
       return NextResponse.json({ error: 'Acesso negado ao pedido' }, { status: 403 })
    }
    if (error.message.includes('CONFLICT')) {
       return NextResponse.json({ error: 'Operação não permitida neste status' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro ao editar pedido' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const cancelado = await pedidoService.cancelarPedido(params.id, session.user.id)
    return NextResponse.json(cancelado)
  } catch (error: any) {
    console.error('[DELETE_PEDIDO]', error)
    
    if (error.message.includes('NOT_FOUND')) {
       return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    if (error.message.includes('FORBIDDEN')) {
       return NextResponse.json({ error: 'Você não tem permissão para cancelar este pedido' }, { status: 403 })
    }
    if (error.message.includes('CONFLICT')) {
       return NextResponse.json({ error: 'Não é possível cancelar um pedido que já foi pago' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro ao cancelar pedido' }, { status: 500 })
  }
}
