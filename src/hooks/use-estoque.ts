import useSWR from 'swr'

export type StatusEstoque = 'OK' | 'ALERTA' | 'CRITICO'

export interface ProdutoEstoqueFrontend {
  id: string
  nome: string
  categoria: string
  qtdEstoque: number
  qtdVisor: number
  total: number
  estoqueMinimo: number
  status: StatusEstoque
  imagemUrl: string | null
}

export interface KPIEstoque {
  alertas: number
  zerados: number
  totalMercadorias: number
}

export interface EstoqueDashboard {
  produtos: ProdutoEstoqueFrontend[]
  kpis: KPIEstoque
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useEstoque() {
  const { data, error, isLoading, mutate } = useSWR<EstoqueDashboard>('/api/estoque', fetcher)

  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    mutate
  }
}
