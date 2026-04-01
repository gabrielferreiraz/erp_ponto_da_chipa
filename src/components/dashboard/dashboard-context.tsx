'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'

interface DashboardContextProps {
  inicio: string | null
  fim: string | null
  periodo: string | null
  queryString: string
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')
  const periodo = searchParams.get('periodo') || 'hoje'

  const params = new URLSearchParams()
  if (inicio) params.set('inicio', inicio)
  if (fim) params.set('fim', fim)
  if (periodo) params.set('periodo', periodo)
  
  const queryString = params.toString()

  return (
    <DashboardContext.Provider value={{ inicio, fim, periodo, queryString }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}
