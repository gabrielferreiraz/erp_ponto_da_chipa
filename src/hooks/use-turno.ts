import useSWR from 'swr'
import { useState } from 'react'

export type TurnoStatus = {
  isClosingShift: boolean
  pedidosPendentes: number
  shiftClosingId: string | null
  usuarioIniciou: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTurno() {
  const { data, isLoading, mutate } = useSWR<TurnoStatus>(
    '/api/turno/status',
    fetcher,
    { refreshInterval: 15000 }
  )

  const [isActing, setIsActing] = useState(false)

  const iniciarFechamento = async (): Promise<{ error?: string }> => {
    setIsActing(true)
    try {
      const res = await fetch('/api/turno/iniciar-fechamento', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) return { error: json.error || 'Erro ao iniciar fechamento' }
      await mutate()
      return {}
    } finally {
      setIsActing(false)
    }
  }

  const confirmarFechamento = async (
    contagens: { produtoId: string; qtdFisica: number }[]
  ): Promise<{ error?: string }> => {
    setIsActing(true)
    try {
      const res = await fetch('/api/turno/confirmar-fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contagens)
      })
      const json = await res.json()
      if (!res.ok) return { error: json.error || 'Erro ao confirmar fechamento' }
      await mutate()
      return {}
    } finally {
      setIsActing(false)
    }
  }

  const cancelarFechamento = async (): Promise<{ error?: string }> => {
    setIsActing(true)
    try {
      const res = await fetch('/api/turno/cancelar-fechamento', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) return { error: json.error || 'Erro ao cancelar fechamento' }
      await mutate()
      return {}
    } finally {
      setIsActing(false)
    }
  }

  return {
    status: data ?? null,
    isLoading,
    isActing,
    iniciarFechamento,
    confirmarFechamento,
    cancelarFechamento,
    mutate
  }
}
