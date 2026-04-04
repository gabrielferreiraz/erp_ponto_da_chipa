import useSWR from 'swr'

export type HistoricoItem = {
  id: string
  nomeSnapshot: string
  precoSnapshot: number
  quantidade: number
}

export type HistoricoPedido = {
  id: string
  codigo: string
  tipo: 'LOCAL' | 'VIAGEM'
  formaPagamento: string | null
  totalFinal: number
  totalCancelado: number
  pagoEm: string | null
  observacao: string | null
  atendente: { nome: string }
  itens: HistoricoItem[]
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Erro ao buscar histórico')
  return r.json()
})

export function useHistoricoCaixa() {
  const { data, isLoading, mutate } = useSWR<HistoricoPedido[]>(
    '/api/caixa/historico',
    fetcher,
    { refreshInterval: 30000 }
  )

  const pedidos = data ?? []
  const totalDia = pedidos.reduce((acc, p) => acc + p.totalFinal, 0)
  const totalPorForma = pedidos.reduce<Record<string, number>>((acc, p) => {
    const forma = p.formaPagamento ?? 'DESCONHECIDO'
    acc[forma] = (acc[forma] ?? 0) + p.totalFinal
    return acc
  }, {})

  return {
    pedidos,
    totalDia,
    totalPorForma,
    isLoading,
    mutate
  }
}
