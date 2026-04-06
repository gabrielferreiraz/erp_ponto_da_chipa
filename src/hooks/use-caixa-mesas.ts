import useSWR from 'swr'
import { Prisma } from '@prisma/client'

export type MesaItemFrontend = Omit<Prisma.ItemPedidoGetPayload<{
  include: { produto: { select: { imagemUrl: true, qtdVisor: true } } }
}>, 'precoSnapshot'> & { precoSnapshot: number }

export type MesaPedidoFrontend = Omit<Prisma.PedidoGetPayload<{
  include: { atendente: { select: { nome: true } } }
}>, 'totalBruto' | 'totalFinal' | 'totalCancelado'> & {
  totalBruto: number
  totalFinal: number
  totalCancelado: number
  itens: MesaItemFrontend[]
}

export type MesaComPedidoFrontend = Prisma.MesaGetPayload<{}> & {
  pedidos: MesaPedidoFrontend[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar mesas')
  return res.json()
}

export function useCaixaMesas() {
  const { data, error, isLoading, mutate } = useSWR<MesaComPedidoFrontend[]>(
    '/api/caixa/mesas',
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 10000,
      dedupingInterval: 2000,
    }
  )

  return {
    mesas: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
