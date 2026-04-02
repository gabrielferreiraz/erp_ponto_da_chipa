import useSWR from 'swr'
import { Prisma } from '@prisma/client'

export type ProdutoWithCategoria = Prisma.ProdutoGetPayload<{
  include: { categoria: true }
}>
// Precisamos forçar o type de preco e precoAnterior para number pois no response já vêm convertidos
export type ProdutoFrontend = Omit<ProdutoWithCategoria, 'preco' | 'precoAnterior'> & {
  preco: number
  precoAnterior: number | null
  sales_count: number
}

export interface ProdutoFilters {
  search?: string
  categoriaId?: string
  status?: string // 'all' | 'disponivel' | 'indisponivel'
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Erro ao buscar produtos')
  return res.json()
})

export function useProdutos(filters?: ProdutoFilters) {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.categoriaId && filters.categoriaId !== 'all') params.append('categoriaId', filters.categoriaId)
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status)

  const queryString = params.toString()
  const key = queryString ? `/api/produtos?${queryString}` : '/api/produtos'

  const { data, error, isLoading, mutate } = useSWR<ProdutoFrontend[]>(key, fetcher)

  return {
    produtos: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
