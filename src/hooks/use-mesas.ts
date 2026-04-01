import useSWR from 'swr'

export interface MesaFrontend {
  id: string
  numero: number
  ativa: boolean
  pedidos: { id: string }[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'Erro ao buscar mesas')
  }
  const json = await res.json()
  return Array.isArray(json) ? json : []
}

export function useMesas() {
  const { data, error, isLoading, mutate } = useSWR<MesaFrontend[]>('/api/mesas', fetcher, {
    refreshInterval: 10000, 
    revalidateOnFocus: true
  })

  return {
    mesas: Array.isArray(data) ? data : [],
    isLoading,
    isError: !!error,
    mutate
  }
}
