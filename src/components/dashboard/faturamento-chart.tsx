'use client'

import useSWR from 'swr'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function FaturamentoLineChart() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/faturamento-serie?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-zinc-100 shadow-2xl rounded-2xl ring-1 ring-black/[0.03]">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">{label}</p>
          <p className="text-xl font-black text-zinc-900 tracking-tight">
            {formatCurrency(payload[0].value)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-emerald-500 uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Vendas Líquidas
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full xl:col-span-8 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Faturamento Histórico</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Performance financeira no período</CardDescription>
          </div>
          <button className="p-2.5 rounded-xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6">
        <div className="h-[350px] w-full">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorFaturamento)" 
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
