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
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { BarChart3, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ProdutosRankingChart() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/produtos-ranking?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white p-4 border border-zinc-100 shadow-2xl rounded-2xl ring-1 ring-black/[0.03]">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">{item.categoria}</p>
          <p className="text-sm font-black text-zinc-900 tracking-tight mb-3">{item.nome}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Vendas</span>
              <span className="text-[11px] font-black text-zinc-900">{item.quantidade} unidades</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Receita</span>
              <span className="text-[11px] font-black text-emerald-600">{formatCurrency(item.receita)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full xl:col-span-4 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-zinc-900 rounded-[32px] overflow-hidden text-white">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight">Top 10 Produtos</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Os mais vendidos do período</CardDescription>
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6">
        <div className="h-[350px] w-full">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-2xl bg-zinc-800" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="nome" 
                  type="category" 
                  fontSize={10}
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#71717A' }}
                  width={100}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="quantidade" 
                  radius={[0, 8, 8, 0]} 
                  barSize={20}
                  animationDuration={1500}
                >
                  {data?.map((_: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#10b981' : index < 3 ? '#3b82f6' : '#27272a'} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
