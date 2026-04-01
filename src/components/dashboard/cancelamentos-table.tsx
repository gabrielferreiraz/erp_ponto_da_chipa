'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { XCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function CancelamentosTable() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/cancelamentos?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  const maxPerda = data?.length > 0 ? Math.max(...data.map((d: any) => d.valorPerdido)) : 0

  return (
    <Card className="col-span-full xl:col-span-6 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Análise de Cancelamentos</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Impacto financeiro por produto</CardDescription>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-zinc-200" />
             </div>
             <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Nenhum cancelamento no período</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.map((item: any) => (
              <div key={item.produto} className="group space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="block font-black text-sm text-zinc-900">{item.produto}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Motivo: {item.motivoPrincipal || 'Não informado'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-sm text-rose-600">{formatCurrency(item.valorPerdido)}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{item.quantidade} unidades</span>
                  </div>
                </div>
                <div className="relative h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.valorPerdido / maxPerda) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
