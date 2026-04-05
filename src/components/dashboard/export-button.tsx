'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { useDashboardContext } from './dashboard-context'
import { cn } from '@/lib/utils'

export function ExportButton() {
  const { queryString } = useDashboardContext()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (loading) return
    setLoading(true)

    try {
      // Validate that the endpoint is reachable before opening the tab
      const res = await fetch(`/api/dashboard/export?${queryString}`, { method: 'GET' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Erro ${res.status} ao gerar relatório`)
      }

      // Get the HTML blob and open in new tab
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const tab = window.open(url, '_blank', 'noopener,noreferrer')

      // Clean up object URL after tab opens
      if (tab) {
        tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
      } else {
        // Fallback: direct link if popups blocked
        URL.revokeObjectURL(url)
        window.location.href = `/api/dashboard/export?${queryString}&autoprint=1`
      }
    } catch (err: any) {
      // Show inline error without crashing
      alert(err.message || 'Não foi possível gerar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      title="Exportar relatório completo em PDF"
      className={cn(
        'flex items-center gap-2 h-11 px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all',
        'bg-white border border-zinc-200/50 shadow-sm ring-1 ring-black/[0.02]',
        'hover:bg-zinc-900 hover:text-white hover:border-zinc-900 hover:shadow-lg hover:shadow-zinc-200',
        'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        loading ? 'text-zinc-400' : 'text-zinc-500',
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Gerando...</span>
        </>
      ) : (
        <>
          <FileDown className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </>
      )}
    </button>
  )
}
