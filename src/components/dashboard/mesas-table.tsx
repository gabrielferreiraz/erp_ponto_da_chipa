'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function MesasTable() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/mesas?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  return (
    <Card className="col-span-full xl:col-span-6 border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[32px] overflow-hidden ring-1 ring-zinc-950/[0.03]">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Mesas mais Ativas</CardTitle>
        <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ranking de faturamento por mesa</CardDescription>
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
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12">Mesa</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-center">Pedidos</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-right">Ticket Médio</TableHead>
                  <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-12 text-right">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((mesa: any) => (
                  <TableRow key={mesa.numero} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                    <TableCell className="py-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-zinc-200">
                        {mesa.numero}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center font-bold text-zinc-600">{mesa.pedidos}</TableCell>
                    <TableCell className="py-4 text-right font-bold text-zinc-600">{formatCurrency(mesa.ticketMedio)}</TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="font-black text-zinc-900">{formatCurrency(mesa.faturamento)}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-zinc-400 font-bold">Nenhum dado encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
