import useSWR from 'swr'

export interface MesaFrontend {
  id: string
  numero: number
  ativa: boolean
  pedidos: { id: string }[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useMesas() {
  const { data, error, isLoading, mutate } = useSWR<MesaFrontend[]>('/api/mesas', fetcher, {
    refreshInterval: 10000, 
    revalidateOnFocus: true
  })

  return {
    mesas: data || [],
    isLoading,
    isError: error,
    mutate
  }
}
