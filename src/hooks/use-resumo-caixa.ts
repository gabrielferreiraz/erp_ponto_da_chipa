import useSWR from 'swr'

export type ResumoCaixa = {
  qtdPedidos: number
  totalVendas: number
  totalDinheiro: number
  totalPix: number
  totalCartaoDebito: number
  totalCartaoCredito: number
  totalCancelados: number
  qtdCancelados: number
  dataInicio: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar resumo de caixa')
  return res.json()
}

export function useResumoCaixa(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<ResumoCaixa>(
    enabled ? '/api/turno/resumo-caixa' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    resumo: data ?? null,
    isLoading,
    isError: !!error,
    mutate
  }
}
