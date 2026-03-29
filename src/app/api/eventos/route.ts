import { NextResponse } from 'next/server'
import { sseEmitter } from '@/lib/sse-emitter'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const customReadable = new ReadableStream({
    start(controller) {
      // Configurar envio do heartbeat pra manter vivo e ping inical 
      controller.enqueue('event: connected\ndata: ok\n\n')

      const handlerNovoPedido = () => {
        controller.enqueue('event: novo_pedido\ndata: {}\n\n')
      }

      const handlerPedidoPago = () => {
        controller.enqueue('event: pedido_pago\ndata: {}\n\n')
      }

      sseEmitter.on('novo_pedido', handlerNovoPedido)
      sseEmitter.on('pedido_pago', handlerPedidoPago)

      // Heartbeat pra evitar fechar socket
      const interval = setInterval(() => {
        controller.enqueue('event: ping\ndata: ping\n\n')
      }, 15000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        sseEmitter.off('novo_pedido', handlerNovoPedido)
        sseEmitter.off('pedido_pago', handlerPedidoPago)
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
