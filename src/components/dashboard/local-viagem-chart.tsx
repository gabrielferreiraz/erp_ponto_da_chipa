'use client'

import useSWR from 'swr'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { Navigation, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function LocalViagemChart() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/local-vs-viagem?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  return (
    <Card className="col-span-full md:col-span-1 xl:col-span-4 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Local vs Viagem</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Onde os clientes consomem mais?</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="periodo" 
                  fontSize={10}
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#A1A1AA' }}
                  dy={10}
                />
                <YAxis 
                  fontSize={10}
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#A1A1AA' }}
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 border border-zinc-100 shadow-2xl rounded-2xl ring-1 ring-black/[0.03]">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">{label}</p>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between gap-8">
                               <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Local</span>
                               </div>
                               <span className="text-[11px] font-black text-zinc-900">{formatCurrency(payload[0].value)}</span>
                             </div>
                             <div className="flex items-center justify-between gap-8">
                               <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Viagem</span>
                               </div>
                               <span className="text-[11px] font-black text-zinc-900">{formatCurrency(payload[1].value)}</span>
                             </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  height={36} 
                  content={({ payload }: any) => (
                    <div className="flex justify-end gap-4 mb-4">
                      {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Bar dataKey="local" name="Local" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="viagem" name="Viagem" fill="#18181b" stackId="a" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
