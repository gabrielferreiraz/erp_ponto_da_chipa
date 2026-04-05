'use client'

import { useState, useEffect } from 'react'

interface LiveClockProps {
  className?: string
}

export function LiveClock({ className }: LiveClockProps) {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      )

    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [])

  // Renders nothing during SSR to avoid hydration mismatch
  if (time === null) return null

  return <span className={className}>{time}</span>
}
