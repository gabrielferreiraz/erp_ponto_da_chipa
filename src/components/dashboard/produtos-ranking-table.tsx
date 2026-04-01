'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ProdutosRankingTable() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/produtos-ranking?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  return (
    <Card className="col-span-full border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Ranking de Produtos Detalhado</CardTitle>
        <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Análise completa de performance por item</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12">Produto</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12">Categoria</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-center">Vendidos</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-right">Ticket Médio</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-right">Receita</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-right">Taxa Canc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((p: any) => (
                  <TableRow key={p.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                    <TableCell className="py-4">
                      <span className="font-bold text-zinc-900">{p.nome}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="px-2 py-1 rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                        {p.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-bold text-zinc-600">{p.quantidade}</span>
                        <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zinc-900 rounded-full" 
                            style={{ width: `${(p.quantidade / data[0].quantidade) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold text-zinc-600">{formatCurrency(p.ticketMedio)}</TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="font-black text-zinc-900">{formatCurrency(p.receita)}</span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <span className={cn(
                        "font-bold text-xs",
                        p.taxaCancelamento > 5 ? "text-rose-500" : "text-zinc-400"
                      )}>
                        {p.taxaCancelamento.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
