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
import { Calendar, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function DiaSemanaChart() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/por-dia-semana?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  return (
    <Card className="col-span-full md:col-span-1 xl:col-span-4 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Movimento por Dia</CardTitle>
            <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Qual o melhor dia para escalar equipe?</CardDescription>
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
                  dataKey="dia" 
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
                        <div className="bg-white p-3 border border-zinc-100 shadow-2xl rounded-2xl ring-1 ring-black/[0.03]">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="text-lg font-black text-zinc-900">{formatCurrency(payload[0].value)}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[6, 6, 6, 6]} 
                  barSize={32}
                  animationDuration={1500}
                >
                  {data?.map((_: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={_.total === Math.max(...data.map((d: any) => d.total)) ? '#3b82f6' : '#f4f4f5'} 
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
