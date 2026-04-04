'use client'

import { useState, useMemo } from 'react'
import {
  Package, ArrowRightLeft, PlusCircle, MinusCircle,
  TrendingDown, AlertTriangle, Search, X,
  RefreshCw, History, Warehouse, SlidersHorizontal,
  ShoppingBag, Loader2, ChevronDown
} from 'lucide-react'
import { useEstoque, ProdutoEstoqueFrontend } from '@/hooks/use-estoque'
import { useMovimentacoes } from '@/hooks/use-movimentacoes'
import { ModalReposicao } from '@/components/estoque/modais/modal-reposicao'
import { ModalEntrada } from '@/components/estoque/modais/modal-entrada'
import { ModalAjuste } from '@/components/estoque/modais/modal-ajuste'
import { ModalPerda } from '@/components/estoque/modais/modal-perda'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type Aba = 'inventario' | 'historico'
type FiltroStatus = 'TODOS' | 'CRITICO' | 'ALERTA' | 'OK'

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  VENDA:           { label: 'Venda',           color: 'text-zinc-600',    bg: 'bg-zinc-100'    },
  REPOSICAO_VISOR: { label: 'Reposição Visor', color: 'text-blue-700',    bg: 'bg-blue-50'     },
  ENTRADA_ESTOQUE: { label: 'Entrada',          color: 'text-emerald-700', bg: 'bg-emerald-50'  },
  AJUSTE:          { label: 'Ajuste Manual',    color: 'text-violet-700',  bg: 'bg-violet-50'   },
  PERDA:           { label: 'Perda',            color: 'text-rose-700',    bg: 'bg-rose-50'     },
}

export default function EstoquePage() {
  const { dashboard, isLoading, mutate: mutateDash } = useEstoque()
  const { movimentacoes, hasMore, loadMore, isLoading: loadingMovs, mutate: mutateMovs } = useMovimentacoes()

  const [aba, setAba] = useState<Aba>('inventario')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS')
  const [busca, setBusca] = useState('')
  const [selRepo, setSelRepo] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selEntrada, setSelEntrada] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selAjuste, setSelAjuste] = useState<ProdutoEstoqueFrontend | null>(null)
  const [selPerda, setSelPerda] = useState<ProdutoEstoqueFrontend | null>(null)

  const handleSuccess = () => { mutateDash(); mutateMovs() }

  const produtosFiltrados = useMemo(() => {
    if (!dashboard?.produtos) return []
    return dashboard.produtos.filter(p => {
      const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus
      const matchBusca = !busca.trim() ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase())
      return matchStatus && matchBusca
    })
  }, [dashboard?.produtos, filtroStatus, busca])

  const totalVisor    = useMemo(() => dashboard?.produtos.reduce((acc, p) => acc + p.qtdVisor, 0) ?? 0, [dashboard])
  const totalDeposito = useMemo(() => dashboard?.produtos.reduce((acc, p) => acc + p.qtdEstoque, 0) ?? 0, [dashboard])
  const qtdOK         = useMemo(() => dashboard?.produtos.filter(p => p.status === 'OK').length ?? 0, [dashboard])

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-zinc-200/60 px-8 h-16 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-[15px] font-black tracking-tight text-zinc-900 leading-none">Gestão de Estoque</h1>
          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Visor · Depósito · Movimentações</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar produto ou categoria..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => { mutateDash(); mutateMovs() }}
            className="h-9 px-4 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>
      </header>

      {/* ── KPIs ── */}
      <div className="bg-white border-b border-zinc-100 px-8 py-4 shrink-0">
        <div className="grid grid-cols-4 gap-4">

          <div className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
            (dashboard?.kpis.zerados ?? 0) > 0 ? "bg-rose-50 border-rose-100" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
              (dashboard?.kpis.zerados ?? 0) > 0 ? "bg-rose-100" : "bg-zinc-100"
            )}>
              <AlertTriangle className={cn("w-5 h-5", (dashboard?.kpis.zerados ?? 0) > 0 ? "text-rose-600" : "text-zinc-400")} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Zerados</p>
              <p className={cn("text-2xl font-black tabular-nums leading-none",
                (dashboard?.kpis.zerados ?? 0) > 0 ? "text-rose-600" : "text-zinc-300"
              )}>
                {isLoading ? '—' : (dashboard?.kpis.zerados ?? 0)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Reposição imediata</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
            (dashboard?.kpis.alertas ?? 0) > 0 ? "bg-amber-50 border-amber-100" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
              (dashboard?.kpis.alertas ?? 0) > 0 ? "bg-amber-100" : "bg-zinc-100"
            )}>
              <TrendingDown className={cn("w-5 h-5", (dashboard?.kpis.alertas ?? 0) > 0 ? "text-amber-600" : "text-zinc-400")} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Em Alerta</p>
              <p className={cn("text-2xl font-black tabular-nums leading-none",
                (dashboard?.kpis.alertas ?? 0) > 0 ? "text-amber-600" : "text-zinc-300"
              )}>
                {isLoading ? '—' : (dashboard?.kpis.alertas ?? 0)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Abaixo do mínimo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border bg-blue-50 border-blue-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">No Visor</p>
              <p className="text-2xl font-black tabular-nums text-blue-700 leading-none">
                {isLoading ? '—' : totalVisor}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Disponível para venda</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border bg-zinc-50 border-zinc-100">
            <div className="w-10 h-10 rounded-2xl bg-zinc-200 flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Depósito</p>
              <p className="text-2xl font-black tabular-nums text-zinc-700 leading-none">
                {isLoading ? '—' : totalDeposito}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Estoque de fundo</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Alerta de Visor ── */}
      {(() => {
        const criticos = dashboard?.produtos.filter(p => p.status === 'CRITICO' || p.status === 'ALERTA') ?? []
        if (criticos.length === 0) return null
        return (
          <div className="border-b border-amber-200 bg-amber-50 px-8 py-3 shrink-0">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-2">
                  {criticos.length} produto{criticos.length !== 1 ? 's' : ''} precisam de atenção no visor
                </p>
                <div className="flex flex-wrap gap-2">
                  {criticos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelRepo(p); setAba('inventario') }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                        p.status === 'CRITICO'
                          ? "bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200"
                          : "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        p.status === 'CRITICO' ? "bg-rose-500" : "bg-amber-500"
                      )} />
                      {p.nome}
                      <span className="font-mono font-black tabular-nums opacity-70">{p.qtdVisor}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Conteúdo ── */}
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setAba('inventario')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[12px] font-bold transition-all",
              aba === 'inventario' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Inventário
          </button>
          <button
            onClick={() => setAba('historico')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[12px] font-bold transition-all",
              aba === 'historico' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <History className="w-3.5 h-3.5" />
            Movimentações
            {movimentacoes.length > 0 && (
              <span className={cn(
                "min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[10px] font-black px-1",
                aba === 'historico' ? "bg-zinc-900 text-white" : "bg-zinc-300/60 text-zinc-500"
              )}>{movimentacoes.length}</span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── INVENTÁRIO ── */}
          {aba === 'inventario' && (
            <motion.div key="inventario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Filtros */}
              <div className="flex items-center gap-2 mb-4">
                {([
                  { key: 'TODOS',   label: 'Todos',   count: dashboard?.produtos.length ?? 0 },
                  { key: 'CRITICO', label: 'Crítico', count: dashboard?.kpis.zerados ?? 0    },
                  { key: 'ALERTA',  label: 'Alerta',  count: dashboard?.kpis.alertas ?? 0    },
                  { key: 'OK',      label: 'OK',      count: qtdOK                            },
                ] as { key: FiltroStatus; label: string; count: number }[]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFiltroStatus(f.key)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                      filtroStatus === f.key
                        ? f.key === 'CRITICO' ? "bg-rose-600 text-white border-rose-600"
                          : f.key === 'ALERTA' ? "bg-amber-500 text-white border-amber-500"
                          : f.key === 'OK'     ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600"
                    )}
                  >
                    {f.label}
                    <span className={cn("text-[10px] font-black tabular-nums",
                      filtroStatus === f.key ? "opacity-70" : "opacity-50"
                    )}>{f.count}</span>
                  </button>
                ))}
                {busca && (
                  <span className="text-[11px] font-bold text-zinc-400 ml-1">
                    · {produtosFiltrados.length} resultado{produtosFiltrados.length !== 1 ? 's' : ''} para "{busca}"
                  </span>
                )}
              </div>

              {/* Tabela */}
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_72px_184px_80px_64px_232px] px-5 h-11 items-center border-b border-zinc-100 bg-zinc-50/60">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produto</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Categoria</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Visor</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center pl-3">Nível</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Depósito</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Mín.</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right pr-1">Ações</span>
                </div>

                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 border-b border-zinc-50 last:border-0 bg-zinc-50/30 animate-pulse" />
                  ))
                ) : produtosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Package className="w-8 h-8 text-zinc-200" />
                    <p className="text-sm font-bold text-zinc-400">Nenhum produto encontrado</p>
                  </div>
                ) : produtosFiltrados.map(p => {
                  const pct = p.estoqueMinimo > 0
                    ? Math.min(100, Math.round((p.qtdVisor / (p.estoqueMinimo * 2)) * 100))
                    : p.qtdVisor > 0 ? 100 : 0
                  const barColor = p.status === 'CRITICO' ? '#f43f5e' : p.status === 'ALERTA' ? '#f59e0b' : '#10b981'
                  const rowHover = p.status === 'CRITICO' ? 'hover:bg-rose-50/60' : p.status === 'ALERTA' ? 'hover:bg-amber-50/40' : 'hover:bg-zinc-50'

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "grid grid-cols-[1fr_140px_72px_184px_80px_64px_232px] px-5 h-14 items-center border-b border-zinc-50 last:border-0 transition-colors",
                        rowHover
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                        <span className="font-bold text-zinc-900 text-[13px] truncate">{p.nome}</span>
                      </div>

                      <div>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-lg text-[11px] font-bold">{p.categoria}</span>
                      </div>

                      <div className="text-center">
                        <span className={cn(
                          "text-xl font-black tabular-nums",
                          p.status === 'CRITICO' ? "text-rose-600" : p.status === 'ALERTA' ? "text-amber-600" : "text-zinc-900"
                        )}>{p.qtdVisor}</span>
                      </div>

                      <div className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 w-8 text-right tabular-nums shrink-0">{pct}%</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-sm font-bold text-zinc-500 tabular-nums">{p.qtdEstoque}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-sm font-bold text-zinc-300 tabular-nums">{p.estoqueMinimo}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelRepo(p)}
                          title="Repor Visor"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-all whitespace-nowrap"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                          Repor
                        </button>
                        <button
                          onClick={() => setSelEntrada(p)}
                          title="Entrada no Depósito"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition-all whitespace-nowrap"
                        >
                          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                          Entrada
                        </button>
                        <button
                          onClick={() => setSelAjuste(p)}
                          title="Ajuste Manual"
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelPerda(p)}
                          title="Registrar Perda"
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── MOVIMENTAÇÕES ── */}
          {aba === 'historico' && (
            <motion.div key="historico" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
                <div className="grid grid-cols-[150px_145px_1fr_72px_120px_1fr] px-6 h-11 items-center border-b border-zinc-100 bg-zinc-50/60">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data / Hora</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipo</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produto</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Qtd</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Responsável</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Observação</span>
                </div>

                <div className="divide-y divide-zinc-50">
                  {loadingMovs && movimentacoes.length === 0 ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse bg-zinc-50/40" />
                    ))
                  ) : movimentacoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <History className="w-8 h-8 text-zinc-200" />
                      <p className="text-sm font-bold text-zinc-400">Nenhuma movimentação registrada.</p>
                    </div>
                  ) : movimentacoes.map(m => {
                    const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'text-zinc-600', bg: 'bg-zinc-100' }
                    return (
                      <div
                        key={m.id}
                        className="grid grid-cols-[150px_145px_1fr_72px_120px_1fr] px-6 h-12 items-center hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-[12px] font-bold text-zinc-500 tabular-nums">
                          {format(new Date(m.criadoEm), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                        <div>
                          <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-black", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-zinc-700 truncate">{m.produto.nome}</span>
                        <div className="text-center">
                          <span className={cn(
                            "font-mono text-sm font-black tabular-nums",
                            m.quantidade > 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                          </span>
                        </div>
                        <span className="text-[12px] font-semibold text-zinc-400 truncate">
                          {m.usuario.nome.split(' ')[0]}
                        </span>
                        <span className="text-[12px] text-zinc-400 italic truncate">
                          {m.observacao || '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {hasMore && (
                  <div className="px-6 py-4 border-t border-zinc-50 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMovs}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-50"
                    >
                      {loadingMovs ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                      Carregar mais registros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ModalReposicao produto={selRepo} onClose={() => setSelRepo(null)} onSuccess={handleSuccess} />
      <ModalEntrada   produto={selEntrada} onClose={() => setSelEntrada(null)} onSuccess={handleSuccess} />
      <ModalAjuste    produto={selAjuste} onClose={() => setSelAjuste(null)} onSuccess={handleSuccess} />
      <ModalPerda     produto={selPerda} onClose={() => setSelPerda(null)} onSuccess={handleSuccess} />
    </div>
  )
}
