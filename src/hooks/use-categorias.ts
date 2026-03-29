import useSWR from 'swr'
import { Prisma } from '@prisma/client'

export type CategoriaWithCount = Prisma.CategoriaGetPayload<{
  include: {
    _count: {
      select: { produtos: true }
    }
  }
}>

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Erro ao buscar dados')
  return res.json()
})

export function useCategorias() {
  const { data, error, isLoading, mutate } = useSWR<CategoriaWithCount[]>('/api/categorias', fetcher)

  return {
    categorias: data || [],
    isLoading,
    isError: !!error,
    mutate
  }
}
