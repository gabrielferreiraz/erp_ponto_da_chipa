import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
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
    const pedidoConfirmado = await pedidoService.confirmarPedido(params.id, session.user.id)
    return NextResponse.json(pedidoConfirmado)
  } catch (error: any) {
    console.error('[PATCH_PEDIDO_CONFIRMAR]', error)
    
    if (error.message.includes('NOT_FOUND')) {
       return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    if (error.message.includes('FORBIDDEN')) {
       return NextResponse.json({ error: 'Acesso negado ao pedido' }, { status: 403 })
    }
    if (error.message.includes('CONFLICT')) {
       return NextResponse.json({ error: 'Operação não permitida neste status' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro ao confirmar pedido' }, { status: 500 })
  }
}
