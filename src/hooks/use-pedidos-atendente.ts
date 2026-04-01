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

import { useSSE } from './use-sse'

export function usePedidosAtendente() {
  const { data, error, isLoading, mutate } = useSWR<PedidoFrontend[]>('/api/pedidos', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000, 
    dedupingInterval: 2000,
  })

  // Compartilha uma única conexão SSE global
  useSSE()

  return {
    pedidos: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
