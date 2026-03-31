import { useEffect } from 'react'
import useSWR from 'swr'
import { Prisma } from '@prisma/client'

export type PedidoItensComProduto = Prisma.ItemPedidoGetPayload<{
  include: {
    produto: {
      select: { imagemUrl: true }
    }
  }
}>

export type PedidoFrontend = Omit<Prisma.PedidoGetPayload<{ include: { mesa: true } }>, 'totalBruto' | 'totalCancelado' | 'totalFinal'> & {
  totalBruto: number
  totalCancelado: number | null
  totalFinal: number
  itens: (Omit<PedidoItensComProduto, 'precoSnapshot'> & { precoSnapshot: number })[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Erro ao buscar pedidos')
  }
  return res.json()
}

export function usePedidosAtendente() {
  const { data, error, isLoading, mutate } = useSWR<PedidoFrontend[]>('/api/pedidos', fetcher, {
    // SWR não precisa de polling pesado pois usaremos o EventSource que empurrará os recarregamentos (Realtime UI).
    revalidateOnFocus: true
  })

  useEffect(() => {
    let es: EventSource | null = null
    let retryDelay = 1000

    const connectSSE = () => {
      es = new EventSource('/api/eventos')

      // Quando entra novo pedido ou status muda
      es.addEventListener('novo_pedido', () => {
        mutate() // SWR reacionário - Revalida o cache sem flicker
      })

      // Quando alguém paga ou manipula pedidos
      es.addEventListener('pedido_pago', () => {
        mutate()
      })

      es.onerror = async () => {
        if (es) {
          es.close()
        }
        // Fallback REST obrigatório
        await mutate()

        setTimeout(() => connectSSE(), retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30000)
      }

      es.onopen = () => {
        retryDelay = 1000 // Reset backoff in success
      }
    }

    connectSSE()

    return () => {
      if (es) {
        es.close()
      }
    }
  }, [mutate])

  return {
    pedidos: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
