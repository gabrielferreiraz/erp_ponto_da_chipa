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
    refreshInterval: 5000 // Polling a cada 5 segundos para tempo real síncrono
  })

  return {
    pedidos: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
