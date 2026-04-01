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

import { useSSE } from './use-sse'

export function useFilaCaixa() {
  const { data, error, isLoading, mutate } = useSWR<FilaPedidoFrontend[]>('/api/caixa/fila', fetchFila, {
    revalidateOnFocus: true,
    refreshInterval: 10000, 
    dedupingInterval: 2000,
  })

  // Compartilha uma única conexão SSE global
  useSSE()

  return {
    fila: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
