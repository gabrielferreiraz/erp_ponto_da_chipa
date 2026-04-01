import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { sseEmitter } from '@/lib/sse-emitter'
import { sseManager } from '@/lib/sse-manager'
import { SecurityLogger } from '@/lib/security-logger'
import { getClientIP } from '@/lib/validations/common'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  const ip = getClientIP(req)
  const route = '/api/eventos'

  // 1. Exigir sessão autenticada
  if (!session?.user) {
    SecurityLogger.log({ event: 'UNAUTHORIZED', route, ip })
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Permitir apenas roles internas
  const allowedRoles = ['ADMIN', 'CAIXA', 'ATENDENTE']
  if (!allowedRoles.includes(session.user.role as string)) {
    SecurityLogger.log({ event: 'FORBIDDEN', route, ip, userId: session.user.id, role: session.user.role })
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // 3. Limitar conexões simultâneas por IP/Sessão
  const connectionKey = `${ip}:${session.user.id}`
  if (!sseManager.addConnection(connectionKey)) {
    SecurityLogger.log({ event: 'RATE_LIMIT', route, ip, userId: session.user.id, details: 'Excedeu limite de conexões SSE' })
    return NextResponse.json({ error: 'Muitas conexões abertas' }, { status: 429 })
  }

  const customReadable = new ReadableStream({
    start(controller) {
      controller.enqueue('event: connected\ndata: ok\n\n')

      const handlerNovoPedido = () => {
        controller.enqueue('event: novo_pedido\ndata: {}\n\n')
      }

      const handlerPedidoPago = () => {
        controller.enqueue('event: pedido_pago\ndata: {}\n\n')
      }

      sseEmitter.on('novo_pedido', handlerNovoPedido)
      sseEmitter.on('pedido_pago', handlerPedidoPago)

      const interval = setInterval(() => {
        controller.enqueue('event: ping\ndata: ping\n\n')
      }, 15000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        sseEmitter.off('novo_pedido', handlerNovoPedido)
        sseEmitter.off('pedido_pago', handlerPedidoPago)
        sseManager.removeConnection(connectionKey)
        controller.close()
      })
    }
  })

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  })
}
