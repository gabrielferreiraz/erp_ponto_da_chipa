'use client'

import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Navigation,
  HelpCircle
} from 'lucide-react'
import { useDashboardContext } from './dashboard-context'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function KPICards() {
  const { queryString } = useDashboardContext()
  const { data, isLoading } = useSWR(`/api/dashboard/kpis?${queryString}`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
    dedupingInterval: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] sm:h-[140px] rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard 
          title="Faturamento"
          value={formatCurrency(data?.totalFaturado || 0)}
          icon={<DollarSign className="w-4 h-4" />}
          color="emerald"
          info="Total líquido de vendas confirmadas e pagas no período."
        />
        <KPICard 
          title="Pedidos"
          value={data?.pedidosPagos || 0}
          icon={<ShoppingBag className="w-4 h-4" />}
          color="blue"
          info="Quantidade total de pedidos finalizados com sucesso."
        />
        <KPICard 
          title="Ticket Médio"
          value={formatCurrency(data?.ticketMedio || 0)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="orange"
          info="Valor médio gasto por cliente em cada pedido."
        />
        <KPICard 
          title="Cancelamentos"
          value={data?.totalCancelado || 0}
          subtitle={formatCurrency(data?.valorCancelado || 0)}
          icon={<XCircle className="w-4 h-4" />}
          color="rose"
          info="Quantidade de itens cancelados e o impacto financeiro total."
        />
        <KPICard 
          title="Mix de Vendas"
          value={`${Math.round(data?.percentualLocal || 0)}%`}
          subtitle={`${Math.round(data?.percentualViagem || 0)}% Viagem`}
          icon={<Navigation className="w-4 h-4" />}
          color="indigo"
          info="Distribuição percentual entre consumo local e retirada/viagem."
        />
        <KPICard 
          title="Hora de Pico"
          value={data?.horaPico !== null ? `${data.horaPico}h` : '--'}
          icon={<Clock className="w-4 h-4" />}
          color="purple"
          info="Horário do dia com maior volume de pedidos processados."
        />
      </div>
    </TooltipProvider>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'emerald' | 'blue' | 'orange' | 'rose' | 'indigo' | 'purple'
  info: string
}

function KPICard({ title, value, subtitle, icon, color, info }: KPICardProps) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100/50",
    orange: "bg-orange-50 text-orange-600 border-orange-100/50",
    rose: "bg-rose-50 text-rose-600 border-rose-100/50",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
    purple: "bg-purple-50 text-purple-600 border-purple-100/50"
  }

  return (
    <Card className="group relative border-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02),0_12px_24px_-4px_rgba(0,0,0,0.02)] bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05),0_20px_40px_-8px_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.03]">
      <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full min-h-[120px] sm:min-h-[140px]">
        <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
          <div className={cn("p-2.5 rounded-xl border transition-colors", colors[color])}>
            {icon}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-zinc-300 hover:text-zinc-500 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-[11px] font-medium bg-zinc-900 text-white border-none rounded-xl p-3 shadow-2xl">
              {info}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-0.5 sm:space-y-1 mt-auto">
          <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[full]">{title}</p>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight truncate">{value}</h3>
          {subtitle && (
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter opacity-80">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
