'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ReloadButton() {
  const [spinning, setSpinning] = useState(false)
  const { mutate } = useSWRConfig()

  const handleReload = async () => {
    if (spinning) return
    setSpinning(true)

    // Revalidate every cached SWR key that belongs to the dashboard
    await mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/dashboard/'),
      undefined,
      { revalidate: true }
    )

    // Keep the spin going for at least 700ms so it feels snappy
    setTimeout(() => setSpinning(false), 700)
  }

  return (
    <button
      onClick={handleReload}
      disabled={spinning}
      title="Recarregar dados"
      className={cn(
        'flex items-center justify-center gap-2 h-11 px-3 sm:px-4 rounded-2xl',
        'bg-white border border-zinc-200/50 text-zinc-400',
        'hover:text-zinc-900 hover:border-zinc-300',
        'transition-all shadow-sm ring-1 ring-black/[0.02]',
        'active:scale-95 disabled:cursor-not-allowed',
      )}
    >
      <RefreshCcw
        className={cn(
          'w-4 h-4 transition-transform',
          spinning && 'animate-spin'
        )}
      />
    </button>
  )
}
