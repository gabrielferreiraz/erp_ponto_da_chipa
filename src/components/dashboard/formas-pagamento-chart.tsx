'use client'

import useSWR from 'swr'
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { CreditCard, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function FormasPagamentoChart() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/formas-pagamento?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  return (
    <Card className="col-span-full md:col-span-1 xl:col-span-4 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Meios de Pagamento</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Distribuição por forma de recebimento</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="valor"
                  nameKey="forma"
                  animationDuration={1500}
                >
                  {data?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload
                      return (
                        <div className="bg-white p-4 border border-zinc-100 shadow-2xl rounded-2xl ring-1 ring-black/[0.03]">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">{item.forma}</p>
                          <p className="text-lg font-black text-zinc-900 mb-1">{formatCurrency(item.valor)}</p>
                          <p className="text-[11px] font-bold text-emerald-500 uppercase">{item.percentual.toFixed(1)}% do total</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  content={({ payload }: any) => (
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
