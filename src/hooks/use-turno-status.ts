import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface TurnoStatus {
  isClosingShift: boolean
  pedidosPendentes: number
  shiftClosingId: string | null
  usuarioIniciou: string | null
  role?: string
}

export function useTurnoStatus() {
  const { data, error, isLoading, mutate } = useSWR<TurnoStatus>('/api/turno/status', fetcher, {
    refreshInterval: 5000 // Atualiza a cada 5 segundos para monitorar status do fechamento
  })

  return {
    status: data,
    isLoading,
    isError: !!error,
    mutate
  }
}
