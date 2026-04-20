'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  CheckCircle2,
  Play,
  XCircle,
  ClipboardCheck,
  Package,
  ArrowRight,
  Banknote,
  CreditCard,
  Smartphone,
  TrendingDown,
  Loader2,
  Receipt,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Minus,
  Plus,
  Printer
} from 'lucide-react'
import { ReciboFechamento } from '@/components/caixa/recibo-fechamento'
import { useTurnoStatus } from '@/hooks/use-turno-status'
import { useEstoque } from '@/hooks/use-estoque'
import { useResumoCaixa } from '@/hooks/use-resumo-caixa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function FechamentoPage() {
  const { status, mutate: mutateStatus, isLoading: loadingStatus } = useTurnoStatus()
  const { dashboard, isLoading: loadingEstoque } = useEstoque()
  const { resumo, isLoading: loadingResumo } = useResumoCaixa(!!status?.isClosingShift)
  const isCego = status ? status.role !== 'ADMIN' : true

  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [dinheiroFisico, setDinheiroFisico] = useState('')
  const [observacaoCaixa, setObservacaoCaixa] = useState('')
  const [showObservacao, setShowObservacao] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [secaoAberta, setSecaoAberta] = useState<'caixa' | 'produtos'>('caixa')

  const [reciboData, setReciboData] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status?.isClosingShift && dashboard?.produtos) {
      const initial: Record<string, number> = {}
      dashboard.produtos.forEach(p => { initial[p.id] = p.qtdVisor })
      setContagens(initial)
    }
  }, [status?.isClosingShift, dashboard?.produtos])

  const handleIniciar = async () => {
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/turno/iniciar-fechamento', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao iniciar fechamento')
      }
      toast.success('Fechamento iniciado!')
      mutateStatus()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelar = async () => {
    try {
      setIsSubmitting(true)
      await fetch('/api/turno/cancelar-fechamento', { method: 'POST' })
      toast.info('Fechamento cancelado.')
      mutateStatus()
      setShowCancelModal(false)
    } catch (error: any) {
      toast.error('Erro ao cancelar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmarFinal = async () => {
    try {
      setIsSubmitting(true)
      const payload = {
        contagens: Object.entries(contagens).map(([produtoId, qtdFisica]) => ({ produtoId, qtdFisica })),
        caixa: {
          dinheiroFisico: parseFloat(dinheiroFisico) || 0,
          observacaoCaixa: observacaoCaixa || undefined
        }
      }

      const res = await fetch('/api/turno/confirmar-fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao finalizar fechamento')
      }

      const responseData = await res.json()

      toast.success('Turno fechado com sucesso!')
      setShowConfirmModal(false)
      setDinheiroFisico('')
      setObservacaoCaixa('')
      setReciboData(responseData.recibo)
      mutateStatus()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDivergenciasEstoque = () => {
    if (!dashboard?.produtos) return { count: 0, totalAjuste: 0 }
    let count = 0, totalAjuste = 0
    dashboard.produtos.forEach(p => {
      const fisica = contagens[p.id] ?? p.qtdVisor
      if (fisica !== p.qtdVisor) { count++; totalAjuste += Math.abs(fisica - p.qtdVisor) }
    })
    return { count, totalAjuste }
  }

  const dinheiroNum = parseFloat(dinheiroFisico) || 0
  const divergenciaCaixa = resumo ? dinheiroNum - resumo.totalDinheiro : 0
  const divEstoque = getDivergenciasEstoque()
  const tudo_ok = !loadingResumo && !loadingEstoque

  if (loadingStatus) return <div className="p-8"><Skeleton className="h-20 w-full" /></div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Fechamento de Turno</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Caixa & Contagem de Estoque</p>
        </div>

        {!status?.isClosingShift ? (
          <div className="flex flex-col items-end gap-2">
            {(status?.pedidosPendentes ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-bold text-rose-600">{status?.pedidosPendentes} pedidos pendentes</span>
              </div>
            )}
            <button
              onClick={handleIniciar}
              disabled={(status?.pedidosPendentes ?? 0) > 0 || isSubmitting}
              className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Iniciar Fechamento
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-white border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4" /> Finalizar Turno
            </button>
          </div>
        )}
      </header>

      {status?.isClosingShift ? (
        <div className="space-y-4">

          {/* ── Seção 1: Fechamento de Caixa ── */}
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <button
              onClick={() => setSecaoAberta(s => s === 'caixa' ? 'produtos' : 'caixa')}
              className="w-full flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6 hover:bg-zinc-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-zinc-900">Fechamento de Caixa</h2>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    {status.usuarioIniciou && `Iniciado por ${status.usuarioIniciou} · `}Vendas do dia
                  </p>
                </div>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", secaoAberta === 'caixa' && 'rotate-180')} />
            </button>

            {secaoAberta === 'caixa' && (
              <div className="border-t border-zinc-100">
                {loadingResumo ? (
                  <div className="p-8 space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
                  </div>
                ) : resumo ? (
                  <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">

                    {/* KPIs do dia */}
                    {!isCego && (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Vendas</p>
                        <p className="text-2xl font-black text-zinc-900 tabular-nums">{fmt(resumo.totalVendas)}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{resumo.qtdPedidos} pedidos pagos</p>
                      </div>
                      <div className={cn(
                        "p-5 rounded-2xl border",
                        resumo.qtdCancelados > 0 ? "bg-rose-50 border-rose-100" : "bg-zinc-50 border-zinc-100"
                      )}>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cancelamentos</p>
                        <p className={cn("text-2xl font-black tabular-nums", resumo.qtdCancelados > 0 ? "text-rose-600" : "text-zinc-300")}>
                          {resumo.qtdCancelados > 0 ? fmt(resumo.totalCancelados) : '—'}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">{resumo.qtdCancelados} pedidos</p>
                      </div>
                      <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pix</p>
                        <p className="text-2xl font-black text-blue-700 tabular-nums">{fmt(resumo.totalPix)}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Transferências</p>
                      </div>
                      <div className="p-5 bg-violet-50 rounded-2xl border border-violet-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cartão</p>
                        <p className="text-2xl font-black text-violet-700 tabular-nums">{fmt(resumo.totalCartaoDebito + resumo.totalCartaoCredito)}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Déb. + Créd.</p>
                      </div>
                    </div>

                    {/* Formas de pagamento detalhadas */}
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Breakdown por Forma de Pagamento</p>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {[
                          { label: 'Dinheiro', icon: Banknote, value: resumo.totalDinheiro, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { label: 'Pix', icon: Smartphone, value: resumo.totalPix, color: 'text-blue-600', bg: 'bg-blue-50' },
                          { label: 'Débito', icon: CreditCard, value: resumo.totalCartaoDebito, color: 'text-violet-600', bg: 'bg-violet-50' },
                          { label: 'Crédito', icon: CreditCard, value: resumo.totalCartaoCredito, color: 'text-pink-600', bg: 'bg-pink-50' },
                        ].map(({ label, icon: Icon, value, color, bg }) => (
                          <div key={label} className="flex items-center justify-between px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", bg)}>
                                <Icon className={cn("w-4 h-4", color)} />
                              </div>
                              <span className="text-sm font-bold text-zinc-600">{label}</span>
                            </div>
                            <span className={cn("font-mono font-black text-sm tabular-nums", value > 0 ? color : "text-zinc-300")}>
                              {fmt(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                      </>
                    )}

                    {/* Campo: dinheiro físico em caixa */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-zinc-900">Dinheiro Físico em Caixa</p>
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Conte o dinheiro e informe o valor total</p>
                        </div>
                        {dinheiroFisico !== '' && !isCego && (
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black",
                            divergenciaCaixa === 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : divergenciaCaixa > 0
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                          )}>
                            <TrendingDown className="w-3 h-3" />
                            {divergenciaCaixa === 0 ? 'Caixa OK' : `Diferença: ${fmt(Math.abs(divergenciaCaixa))} ${divergenciaCaixa > 0 ? 'a mais' : 'a menos'}`}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={dinheiroFisico}
                          onChange={e => setDinheiroFisico(e.target.value)}
                          className="w-full h-14 pl-10 pr-4 bg-white border-2 border-zinc-200 rounded-2xl text-lg font-black text-zinc-900 focus:outline-none focus:border-zinc-900 transition-all tabular-nums"
                        />
                      </div>

                      <button
                        onClick={() => setShowObservacao(s => !s)}
                        className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {showObservacao ? 'Ocultar observação' : 'Adicionar observação'}
                      </button>
                      {showObservacao && (
                        <textarea
                          rows={2}
                          placeholder="Ex: falta de troco, diferença justificada..."
                          value={observacaoCaixa}
                          onChange={e => setObservacaoCaixa(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm text-zinc-700 font-medium focus:outline-none focus:border-zinc-400 resize-none transition-all"
                        />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ── Seção 2: Contagem de Estoque ── */}
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <button
              onClick={() => setSecaoAberta(s => s === 'produtos' ? 'caixa' : 'produtos')}
              className="w-full flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6 hover:bg-zinc-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-zinc-900">Contagem Física do Visor</h2>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    Informe a quantidade real de cada item
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-100 transition-all sm:w-auto w-max shrink-0",
                  divEstoque.count > 0 && !isCego ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-700">
                    {divEstoque.count || 0} divergência{divEstoque.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", secaoAberta === 'produtos' && 'rotate-180')} />
            </button>

            {secaoAberta === 'produtos' && (
              <div className="border-t border-zinc-100">
                {loadingEstoque ? (
                  <div className="p-8 space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : (
                  <div>
                    {/* Cabeçalho Desktop (escondido no mobile) */}
                    <div className={cn(
                      "hidden sm:grid px-8 h-10 items-center bg-zinc-50/80 border-b border-zinc-100",
                      isCego ? "grid-cols-[1fr_160px]" : "grid-cols-[1fr_100px_160px_100px]"
                    )}>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produto</span>
                      {!isCego && <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sistema</span>}
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Físico</span>
                      {!isCego && <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Diferença</span>}
                    </div>

                    <div className="divide-y divide-zinc-50">
                      {dashboard?.produtos.map(p => {
                        const qtdFisica = contagens[p.id] ?? p.qtdVisor
                        const diferenca = qtdFisica - p.qtdVisor
                        const hasDivergence = diferenca !== 0

                        return (
                          <div
                            key={p.id}
                            className={cn(
                              "flex flex-col sm:grid px-5 sm:px-8 py-4 sm:items-center gap-4 sm:gap-0 transition-colors",
                              isCego ? "sm:grid-cols-[1fr_160px]" : "sm:grid-cols-[1fr_100px_160px_100px]",
                              hasDivergence ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-zinc-50/50"
                            )}
                          >
                            <div className="flex justify-between items-start sm:block">
                              <div>
                                <p className="font-bold text-zinc-900 text-[13px]">{p.nome}</p>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">{p.categoria}</p>
                              </div>
                              {/* Sistema no Mobile */}
                              {!isCego && (
                                <div className="sm:hidden text-right">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Sistema</span>
                                  <span className="text-lg font-black text-zinc-500 tabular-nums">{p.qtdVisor}</span>
                                </div>
                              )}
                            </div>

                            {/* Sistema no Desktop */}
                            {!isCego && (
                              <div className="hidden sm:block text-center">
                                <span className="text-xl font-black text-zinc-500 tabular-nums">{p.qtdVisor}</span>
                              </div>
                            )}

                            {/* Input Físico e Diferença (Mobile + Desktop) */}
                            <div className="flex items-center gap-4 sm:contents">
                              <div className="flex-1 sm:flex-none flex justify-end sm:justify-center">
                                <div className="flex items-center w-full sm:w-auto bg-zinc-100 p-1 rounded-2xl ring-1 ring-zinc-200/60">
                                  <button
                                    onClick={() => setContagens(prev => ({ ...prev, [p.id]: Math.max(0, qtdFisica - 1) }))}
                                    className="w-12 h-11 flex items-center justify-center rounded-xl bg-white shadow-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
                                  >
                                    <Minus className="w-5 h-5" />
                                  </button>
                                  <Input
                                    type="number"
                                    className="flex-1 sm:w-16 h-11 text-center font-black text-xl bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 tabular-nums"
                                    value={qtdFisica}
                                    onChange={e => setContagens(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                                    min={0}
                                  />
                                  <button
                                    onClick={() => setContagens(prev => ({ ...prev, [p.id]: qtdFisica + 1 }))}
                                    className="w-12 h-11 flex items-center justify-center rounded-xl bg-white shadow-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              {!isCego && (
                                <div className="w-24 sm:w-auto text-right">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 sm:hidden">Dif.</span>
                                  <span className={cn(
                                    "font-black text-xl tabular-nums",
                                    diferenca === 0 ? "text-zinc-200" : diferenca > 0 ? "text-emerald-600" : "text-rose-600"
                                  )}>
                                    {diferenca === 0 ? '—' : diferenca > 0 ? `+${diferenca}` : diferenca}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      ) : (
        /* Estado vazio — nenhum fechamento em andamento */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-zinc-200" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900">Operação Normal</h2>
            <p className="text-zinc-400 font-medium max-w-[320px]">
              Nenhum fechamento em andamento. Inicie o processo quando o turno acabar.
            </p>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação ── */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-zinc-900 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-emerald-400" />
              Confirmar Fechamento
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium pt-2 text-sm">
              Revise o resumo antes de consolidar o fechamento do turno.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-5 bg-white">
            {/* Resumo de caixa */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Caixa</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Vendas</span>
                  <span className="text-xl font-black text-zinc-900">{resumo ? fmt(resumo.totalVendas) : '—'}</span>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border",
                  divergenciaCaixa === 0 ? "bg-emerald-50 border-emerald-100"
                    : divergenciaCaixa > 0 ? "bg-blue-50 border-blue-100"
                      : "bg-rose-50 border-rose-100"
                )}>
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Dif. Dinheiro</span>
                  <span className={cn(
                    "text-xl font-black",
                    divergenciaCaixa === 0 ? "text-emerald-600" : divergenciaCaixa > 0 ? "text-blue-600" : "text-rose-600"
                  )}>
                    {divergenciaCaixa === 0 ? 'OK' : `${divergenciaCaixa > 0 ? '+' : ''}${fmt(divergenciaCaixa)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo estoque */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estoque</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Divergências</span>
                  <span className="text-xl font-black text-zinc-900">{divEstoque.count}</span>
                  <span className="text-[10px] font-bold text-zinc-400 block mt-0.5">produtos afetados</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Ajustado</span>
                  <span className="text-xl font-black text-zinc-900">{divEstoque.totalAjuste}</span>
                  <span className="text-[10px] font-bold text-zinc-400 block mt-0.5">unidades físicas</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                Esta ação registrará ajustes automáticos de estoque e salvará o histórico de caixa do turno.
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-white gap-3 flex-col sm:flex-row">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 min-h-[56px] shrink-0 rounded-2xl border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
            >
              Voltar e Revisar
            </button>
            <button
              onClick={handleConfirmarFinal}
              disabled={isSubmitting}
              className="flex-1 min-h-[56px] shrink-0 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Confirmar</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Cancelamento ── */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-zinc-900 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <XCircle className="w-6 h-6 text-rose-400" />
              Cancelar Fechamento
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium pt-2 text-sm">
              Tem certeza que deseja interromper este processo?
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pb-6 bg-white space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-zinc-600 font-medium text-sm leading-relaxed">
              O turno continuará aberto para novas vendas e as contagens parciais de estoque e caixa <strong className="text-rose-600">serão descartadas</strong>.
            </p>
          </div>

          <DialogFooter className="p-8 pt-0 bg-white gap-3 flex-col sm:flex-row">
            <button
              onClick={() => setShowCancelModal(false)}
              disabled={isSubmitting}
              className="flex-1 min-h-[56px] shrink-0 rounded-2xl border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={handleCancelar}
              disabled={isSubmitting}
              className="flex-1 min-h-[56px] shrink-0 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Descartar Validação</span></>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Impressão do Recibo ── */}
      <Dialog open={!!reciboData} onOpenChange={(v) => !v && setReciboData(null)}>
        <DialogContent className="max-w-[400px] p-0 bg-zinc-200 border-none shadow-2xl overflow-hidden rounded-md">
          {reciboData && (
             <div className="bg-white mx-4 mt-6 mb-4 shadow-sm relative no-scrollbar max-h-[60vh] overflow-y-auto">
               <ReciboFechamento ref={printRef} {...reciboData} usuario={status?.usuarioIniciou || 'Caixa'} data={new Date().toISOString()} />
             </div>
          )}
          <div className="p-4 bg-zinc-200 border-t border-zinc-300 flex items-center justify-between no-print gap-3">
             <button
               onClick={() => setReciboData(null)}
               className="h-12 px-6 flex items-center justify-center rounded-xl bg-white text-zinc-600 font-bold hover:bg-zinc-100 transition-colors shadow-sm focus:outline-none"
             >
               Fechar
             </button>
             <button
               onClick={() => window.print()}
               className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none"
             >
               <Printer className="w-5 h-5" /> Imprimir Recibo
             </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
