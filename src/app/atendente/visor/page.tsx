'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Minus, Plus, Loader2, X, Search, ArrowRight } from 'lucide-react'

type ProdutoVisor = {
  id: string
  nome: string
  categoria: string
  qtdVisor: number
  qtdEstoque: number
  estoqueMinimo: number
  status: 'CRITICO' | 'ALERTA' | 'OK'
  imagemUrl: string | null
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Erro ao buscar produtos')
  return r.json()
})

export default function VisorPage() {
  const { data, isLoading, mutate } = useSWR<ProdutoVisor[]>('/api/atendente/visor', fetcher, {
    refreshInterval: 15000
  })

  const [selecionado, setSelecionado] = useState<ProdutoVisor | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busca, setBusca] = useState('')

  const produtos = data ?? []

  const produtosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return produtos
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
    )
  }, [produtos, busca])

  const criticos = produtos.filter(p => p.status === 'CRITICO').length
  const alertas  = produtos.filter(p => p.status === 'ALERTA').length

  const handleAbrirModal = (p: ProdutoVisor) => {
    if (p.qtdEstoque === 0) return
    setSelecionado(p)
    setQuantidade(1)
  }

  const handleFechar = () => {
    setSelecionado(null)
    setQuantidade(1)
  }

  const handleConfirmar = async () => {
    if (!selecionado || quantidade <= 0) return
    if (quantidade > selecionado.qtdEstoque) {
      toast.error(`Máximo disponível: ${selecionado.qtdEstoque} unidades`)
      return
    }
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/atendente/reposicao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: selecionado.id, quantidade })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao repor visor')
      }
      toast.success(`+${quantidade} no visor — ${selecionado.nome}`)
      mutate()
      handleFechar()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-5 md:px-12 pt-6 pb-8 max-w-[1600px] mx-auto">

      {/* ── Cabeçalho ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-1">Atendente</p>
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900 leading-none">Reposição do Visor</h1>
        </div>

        {(criticos > 0 || alertas > 0) && (
          <div className="flex items-center gap-3 text-[11px] font-bold">
            {criticos > 0 && (
              <span className="text-rose-600">
                {criticos} zerado{criticos !== 1 ? 's' : ''}
              </span>
            )}
            {criticos > 0 && alertas > 0 && <span className="text-zinc-200">·</span>}
            {alertas > 0 && (
              <span className="text-amber-500">
                {alertas} baixo{alertas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Busca ── */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full h-10 pl-10 pr-9 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white h-36 md:h-44 animate-pulse" />
          ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-sm font-bold text-zinc-300">Nenhum produto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden">
          {produtosFiltrados.map(p => {
            const semDeposito = p.qtdEstoque === 0
            const isCritico = p.status === 'CRITICO'
            const isAlerta  = p.status === 'ALERTA'

            return (
              <button
                key={p.id}
                onClick={() => handleAbrirModal(p)}
                disabled={semDeposito}
                className={cn(
                  'group relative flex flex-col text-left transition-all duration-150 overflow-hidden',
                  isCritico ? 'bg-rose-50 active:bg-rose-100' : 'bg-white active:bg-zinc-50',
                  semDeposito ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                  !semDeposito && 'hover:z-10 hover:shadow-[0_0_0_2px_#18181b]'
                )}
              >
                {/* Imagem — exibida quando disponível */}
                {p.imagemUrl ? (
                  <div className="relative w-full h-32 md:h-40 shrink-0 overflow-hidden">
                    <img
                      src={p.imagemUrl}
                      alt={p.nome}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradiente + quantidade sobre a imagem */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <span className={cn(
                      'absolute bottom-2 left-3 text-4xl font-black tabular-nums leading-none tracking-tighter drop-shadow-sm',
                      isCritico ? 'text-rose-300' : isAlerta ? 'text-amber-300' : 'text-white'
                    )}>
                      {p.qtdVisor}
                    </span>
                    {/* Barra de alerta no topo */}
                    {(isCritico || isAlerta) && (
                      <div className={cn(
                        'absolute top-0 left-0 right-0 h-[3px]',
                        isCritico ? 'bg-rose-500' : 'bg-amber-400'
                      )} />
                    )}
                  </div>
                ) : (
                  /* Sem imagem — layout original com número grande */
                  <div className="flex flex-col justify-between p-4 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 leading-none truncate">
                      {p.categoria}
                    </p>
                    <div className="flex-1 flex flex-col justify-center mb-3">
                      <span className={cn(
                        'text-5xl font-black tabular-nums leading-none tracking-tighter',
                        isCritico ? 'text-rose-600' : isAlerta ? 'text-amber-500' : 'text-zinc-900'
                      )}>
                        {p.qtdVisor}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">
                        no visor
                      </span>
                    </div>
                  </div>
                )}

                {/* Rodapé — sempre visível */}
                <div className={cn(
                  'flex items-end justify-between',
                  p.imagemUrl ? 'p-3 pt-2.5' : 'px-4 pb-4'
                )}>
                  <div className="min-w-0">
                    {p.imagemUrl && (
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5 leading-none truncate">
                        {p.categoria}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-zinc-900 leading-tight line-clamp-2">
                      {p.nome}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-black tabular-nums text-zinc-400">
                      {semDeposito ? (
                        <span className="text-rose-400">sem dep.</span>
                      ) : (
                        <>dep. {p.qtdEstoque}</>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Modal / bottom sheet ── */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px]"
          onClick={e => { if (e.target === e.currentTarget) handleFechar() }}
        >
          <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 mb-16 sm:mb-0">

            {/* Handle bar — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-zinc-200 rounded-full" />
            </div>

            {/* Conteúdo */}
            <div className="px-6 pt-4 pb-2">
              {/* Cabeçalho modal */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                    {selecionado.categoria}
                  </p>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                    {selecionado.nome}
                  </h2>
                </div>
                <button
                  onClick={handleFechar}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all mt-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Estado atual */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Visor atual</p>
                  <p className={cn(
                    "text-4xl font-black tabular-nums leading-none",
                    selecionado.status === 'CRITICO' ? 'text-rose-600' :
                    selecionado.status === 'ALERTA'  ? 'text-amber-500' : 'text-zinc-900'
                  )}>
                    {selecionado.qtdVisor}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Ficará com</p>
                  <p className="text-4xl font-black tabular-nums leading-none text-emerald-600">
                    {selecionado.qtdVisor + quantidade}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Depósito</p>
                  <p className="text-lg font-black tabular-nums text-zinc-400">
                    {selecionado.qtdEstoque}
                  </p>
                </div>
              </div>

              {/* Seletor de quantidade */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
                  Quantas unidades adicionar?
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                    className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all active:scale-95 font-black"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={selecionado.qtdEstoque}
                    value={quantidade}
                    onChange={e => setQuantidade(Math.max(1, Math.min(Number(e.target.value) || 1, selecionado.qtdEstoque)))}
                    className="flex-1 h-14 text-center text-3xl font-black font-mono text-zinc-900 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 transition-colors tabular-nums"
                  />

                  <button
                    onClick={() => setQuantidade(q => Math.min(q + 1, selecionado.qtdEstoque))}
                    className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all active:scale-95 font-black"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Atalhos rápidos */}
                <div className="flex gap-2 mt-3">
                  {[5, 10, 20, 30].filter(q => q <= selecionado.qtdEstoque).map(q => (
                    <button
                      key={q}
                      onClick={() => setQuantidade(q)}
                      className={cn(
                        'flex-1 h-9 rounded-lg text-[12px] font-black transition-all border',
                        quantidade === q
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão confirmar */}
            <div className="px-6 pb-8">
              <button
                onClick={handleConfirmar}
                disabled={isSubmitting || quantidade <= 0}
                className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[13px] uppercase tracking-[0.12em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>Adicionar {quantidade} ao Visor</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
