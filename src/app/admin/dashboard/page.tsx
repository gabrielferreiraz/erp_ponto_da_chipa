'use client'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  XCircle, 
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap
} from 'lucide-react'
import { useDashboard, PeriodoDashboard } from '@/hooks/use-dashboard'
import { formatCurrency } from '@/lib/format'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface RankingItem {
  id: string
  nome: string
  quantidade: number
  total: number
}

interface MotivoItem {
  motivo: string
  quantidade: number
}

export default function AdminDashboardPage() {
  const { 
    periodo, 
    setPeriodo, 
    resumo, 
    ranking, 
    vendasPorDia, 
    cancelamentos,
    loadingResumo,
    loadingRanking,
    loadingVendas,
    loadingCancelamentos
  } = useDashboard()

  const formatDataGrafico = (data: string) => {
    try {
      return format(parseISO(data), 'dd/MM', { locale: ptBR })
    } catch {
      return data
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-zinc-100 shadow-xl rounded-xl">
          <p className="text-xs font-bold text-zinc-400 uppercase mb-2">
            {format(parseISO(label), 'dd MMM yyyy', { locale: ptBR })}
          </p>
          <p className="text-lg font-black text-zinc-900">
            {formatCurrency(payload[0].value)}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-1">
            <Zap className="w-3 h-3 fill-emerald-500" />
            Vendas Processadas
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 space-y-10">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-3xl font-black tracking-tight text-zinc-900">Insights</h1>
          </div>
          <p className="text-zinc-500 font-medium">Análise de performance e métricas em tempo real.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 text-zinc-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-bold">Período:</span>
          </div>
          <Select 
            value={periodo} 
            onValueChange={(v) => setPeriodo(v as PeriodoDashboard)}
          >
            <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 font-bold text-zinc-900">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-100 shadow-2xl">
              <SelectItem value="hoje" className="font-medium">Hoje</SelectItem>
              <SelectItem value="7dias" className="font-medium">7 dias</SelectItem>
              <SelectItem value="30dias" className="font-medium">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Grid de KPIs - Design de Agência */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Faturamento Total"
          value={formatCurrency(resumo?.totalVendido || 0)}
          subtitle="Receita líquida processada"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          loading={loadingResumo}
          trend="+12.5%"
          trendType="up"
          color="emerald"
        />
        <KPICard 
          title="Pedidos Concluídos"
          value={resumo?.quantidadePedidos || 0}
          subtitle="Vendas pagas e finalizadas"
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
          loading={loadingResumo}
          trend="+5.2%"
          trendType="up"
          color="indigo"
        />
        <KPICard 
          title="Ticket Médio"
          value={formatCurrency(resumo?.ticketMedio || 0)}
          subtitle="Valor médio por comanda"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          loading={loadingResumo}
          trend="-2.1%"
          trendType="down"
          color="amber"
        />
        <KPICard 
          title="Perda por Cancelamento"
          value={formatCurrency(cancelamentos?.totalPerdaFinanceira || 0)}
          subtitle="Impacto de itens anulados"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          loading={loadingCancelamentos}
          trend="+0.4%"
          trendType="down"
          color="rose"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Gráfico Principal de Vendas */}
        <Card className="lg:col-span-8 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-zinc-900">Fluxo de Vendas</CardTitle>
                <CardDescription className="text-zinc-400 font-medium">Histórico de faturamento nos últimos 30 dias</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-sm bg-emerald-50 px-3 py-1.5 rounded-full">
                <ArrowUpRight className="w-4 h-4" />
                <span>R$ 1.2k hoje</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            <div className="h-[350px] w-full">
              {loadingVendas ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vendasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={formatDataGrafico}
                      fontSize={11}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#A1A1AA' }}
                      dy={10}
                    />
                    <YAxis 
                      fontSize={11}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#A1A1AA' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ranking Visual de Produtos */}
        <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-zinc-900 text-white rounded-3xl">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black">Líderes de Vendas</CardTitle>
            <CardDescription className="text-zinc-500 font-medium">Produtos com maior saída no período</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {loadingRanking ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-zinc-800 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {ranking?.map((p: RankingItem, index: number) => (
                  <div key={p.id} className="group relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-sm text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="space-y-0.5">
                           <span className="block font-bold text-sm leading-tight group-hover:text-white transition-colors">
                             {p.nome}
                           </span>
                           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                             {p.quantidade} Vendidos
                           </span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="block font-black text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                           {formatCurrency(p.total)}
                         </span>
                      </div>
                    </div>
                    <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                         className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-white"
                         style={{ width: `${(p.quantidade / (ranking[0]?.quantidade || 1)) * 100}%` }}
                       />
                    </div>
                  </div>
                ))}
                {!ranking?.length && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                     <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-zinc-600" />
                     </div>
                     <p className="text-zinc-500 font-bold text-sm">Sem dados para o período.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Cancelamentos e Motivos - Design Compacto */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-rose-50 rounded-2xl">
                 <TrendingDown className="w-6 h-6 text-rose-600" />
               </div>
               <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase">Alerta de Perda</span>
            </div>
            <div className="space-y-2">
               <h3 className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Taxa de Abandono</h3>
               {loadingCancelamentos ? (
                 <Skeleton className="h-10 w-32 rounded-xl" />
               ) : (
                 <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-rose-600">{cancelamentos?.taxaCancelamento.toFixed(1)}%</span>
                   <span className="text-zinc-400 font-bold text-sm mb-1.5">do total</span>
                 </div>
               )}
            </div>
            <Progress value={cancelamentos?.taxaCancelamento || 0} className="h-2 bg-rose-50 [&>div]:bg-rose-500" />
            <p className="text-xs font-medium text-zinc-400">Calculado sobre a relação itens ativos vs cancelados.</p>
          </div>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <BarChart3 className="w-32 h-32 text-zinc-900" />
          </div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-black text-zinc-900">Motivos Frequentes</h3>
            {loadingCancelamentos ? (
              <div className="grid grid-cols-2 gap-4">
                 <Skeleton className="h-14 w-full rounded-2xl" />
                 <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {cancelamentos?.motivosFrequentes.map((m: MotivoItem) => (
                  <div key={m.motivo} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all cursor-default">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Motivo</span>
                      <span className="font-bold text-zinc-900 capitalize">{m.motivo.toLowerCase()}</span>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-zinc-900 shadow-sm border border-zinc-100">
                      {m.quantidade}
                    </div>
                  </div>
                ))}
                {!cancelamentos?.motivosFrequentes.length && (
                  <div className="col-span-2 py-6 text-center text-zinc-400 font-bold">Nenhum registro encontrado.</div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KPICard({ title, value, subtitle, icon, loading, trend, trendType, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  }

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl hover:translate-y-[-4px] transition-all duration-300">
      <CardContent className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn("p-3 rounded-2xl", colors[color])}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full",
              trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{title}</h3>
          {loading ? (
            <Skeleton className="h-10 w-32 rounded-xl" />
          ) : (
            <div className="text-3xl font-black text-zinc-900">{value}</div>
          )}
        </div>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
