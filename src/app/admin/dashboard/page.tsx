import { Suspense } from 'react'
import { DashboardProvider } from '@/components/dashboard/dashboard-context'
import { PeriodoSelector } from '@/components/dashboard/periodo-selector'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { FaturamentoLineChart } from '@/components/dashboard/faturamento-chart'
import { ProdutosRankingChart } from '@/components/dashboard/produtos-ranking-chart'
import { DiaSemanaChart } from '@/components/dashboard/dia-semana-chart'
import { FormasPagamentoChart } from '@/components/dashboard/formas-pagamento-chart'
import { LocalViagemChart } from '@/components/dashboard/local-viagem-chart'
import { CancelamentosTable } from '@/components/dashboard/cancelamentos-table'
import { MesasTable } from '@/components/dashboard/mesas-table'
import { ProdutosRankingTable } from '@/components/dashboard/produtos-ranking-table'
import { Layers, RefreshCcw } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto overflow-x-hidden">
        {/* Header Premium - Design de Agência */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-0 z-30 bg-[#FAFAFA]/80 backdrop-blur-xl py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200 ring-1 ring-white/10">
                  <Layers className="w-5 h-5 text-white" />
               </div>
               <div>
                 <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-none">Insights Admin</h1>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">Inteligência de Dados Ponto da Chipa</p>
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
             <PeriodoSelector />
             <div className="hidden sm:block w-px h-8 bg-zinc-200/50 mx-2" />
             <button className="flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-white border border-zinc-200/50 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm ring-1 ring-black/[0.02] active:scale-95">
                <RefreshCcw className="w-4 h-4" />
             </button>
          </div>
        </header>

        {/* Grid de KPIs Principal */}
        <section className="space-y-6">
          <KPICards />
        </section>

        {/* Grid Principal de Gráficos */}
        <section className="grid gap-6 lg:grid-cols-12">
          <FaturamentoLineChart />
          <ProdutosRankingChart />
        </section>

        {/* Gráficos Secundários e Análises */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DiaSemanaChart />
          <FormasPagamentoChart />
          <LocalViagemChart />
        </section>

        {/* Tabelas e Rankings Detalhados */}
        <section className="grid gap-6 lg:grid-cols-12">
          <CancelamentosTable />
          <MesasTable />
        </section>

        <section className="pb-10">
          <ProdutosRankingTable />
        </section>

        {/* Footer Minimalista */}
        <footer className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
           <p>© 2026 Ponto da Chipa - Sistema de Inteligência</p>
           <div className="flex gap-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Dados Atualizados em Tempo Real
              </span>
           </div>
        </footer>
      </div>
    </DashboardProvider>
  )
}
