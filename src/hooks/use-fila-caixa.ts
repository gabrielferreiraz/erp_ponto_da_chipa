import { useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Prisma } from '@prisma/client'

export type FilaItemFrontend = Omit<Prisma.ItemPedidoGetPayload<{
  include: { produto: { select: { imagemUrl: true, qtdVisor: true } } }
}>, 'precoSnapshot'> & { precoSnapshot: number }

export type FilaPedidoFrontend = Omit<Prisma.PedidoGetPayload<{
  include: { mesa: true, atendente: { select: { nome: true } } }
}>, 'totalBruto' | 'totalFinal' | 'totalCancelado'> & {
  totalBruto: number
  totalFinal: number
  totalCancelado: number
  itens: FilaItemFrontend[]
}

const fetchFila = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar fila do sistema')
  return res.json()
}

export function useFilaCaixa() {
  const { data, error, isLoading, mutate } = useSWR<FilaPedidoFrontend[]>('/api/caixa/fila', fetchFila, {
    // SWR usa Realtime via SSE, mas deixamos um polling leve (10s) de segurança caso o SSE falhe/bufferize na rede.
    revalidateOnFocus: true,
    refreshInterval: 10000, 
    dedupingInterval: 2000, // Evita múltiplos fetches se o SSE e o polling dispararem juntos
  })

  useEffect(() => {
    let es: EventSource | null = null
    let retryDelay = 1000

    const connectSSE = () => {
      es = new EventSource('/api/eventos')

      // Quando entra novo pedido
      es.addEventListener('novo_pedido', () => {
        mutate() // SWR reacionário
      })

      // Quando alguem paga pedido noutro caixa
      es.addEventListener('pedido_pago', () => {
        mutate()
        globalMutate('/api/estoque')
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
        retryDelay = 1000 // Reset backoff success
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
    fila: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
