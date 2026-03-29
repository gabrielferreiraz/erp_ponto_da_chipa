import { useState } from 'react'
import useSWR from 'swr'

export interface MovimentacaoEstoqueFrontend {
  id: string
  produtoId: string
  produto: { nome: string }
  tipo: 'VENDA' | 'REPOSICAO_VISOR' | 'ENTRADA_ESTOQUE' | 'AJUSTE' | 'PERDA'
  origem: 'ESTOQUE' | 'VISOR'
  quantidade: number
  usuarioId: string
  usuario: { nome: string }
  observacao: string | null
  criadoEm: string
}

export interface MovimentacoesResponse {
  data: MovimentacaoEstoqueFrontend[]
  hasMore: boolean
  total: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useMovimentacoes(produtoId?: string) {
  const [page, setPage] = useState(1)
  const limit = 100

  const { data, error, isLoading, mutate } = useSWR<MovimentacoesResponse>(
    `/api/estoque/movimentacoes?page=${page}&limit=${limit}${produtoId ? `&produtoId=${produtoId}` : ''}`,
    fetcher,
    { keepPreviousData: true }
  )

  const loadMore = () => {
    if (data?.hasMore) {
      setPage(prev => prev + 1)
    }
  }

  return {
    movimentacoes: data?.data || [],
    hasMore: data?.hasMore || false,
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    loadMore,
    mutate
  }
}
