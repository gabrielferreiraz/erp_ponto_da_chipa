import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export type PeriodoDashboard = 'hoje' | '7dias' | '30dias'

export function useDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoDashboard>('hoje')

  const { data: resumo, isLoading: loadingResumo } = useSWR(
    `/api/dashboard/kpis?periodo=${periodo}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutos
  )

  const { data: ranking, isLoading: loadingRanking } = useSWR(
    `/api/dashboard/produtos-ranking?periodo=${periodo}`,
    fetcher,
    { refreshInterval: 300000 }
  )

  const { data: vendasPorDia, isLoading: loadingVendas } = useSWR(
    `/api/dashboard/faturamento-serie?periodo=${periodo}`,
    fetcher,
    { refreshInterval: 300000 }
  )

  const { data: cancelamentos, isLoading: loadingCancelamentos } = useSWR(
    `/api/dashboard/cancelamentos?periodo=${periodo}`,
    fetcher,
    { refreshInterval: 300000 }
  )

  return {
    periodo,
    setPeriodo,
    resumo,
    ranking,
    vendasPorDia,
    cancelamentos,
    isLoading: loadingResumo || loadingRanking || loadingVendas || loadingCancelamentos,
    loadingResumo,
    loadingRanking,
    loadingVendas,
    loadingCancelamentos
  }
}
