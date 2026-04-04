'use client'

import { useState, useMemo } from 'react'
import {
  Clock, Banknote, XCircle, UserCircle, Hash, Loader2, Wifi, WifiOff,
  Trash2, Minus, Plus, MapPin, AlertTriangle, Search, X,
  History, ShoppingBag, Receipt, ChevronDown, ChevronUp,
  MessageSquare, Bike, UtensilsCrossed, RotateCcw, AlertCircle
} from 'lucide-react'
import { differenceInMinutes, format } from 'date-fns'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { useHistoricoCaixa } from '@/hooks/use-historico-caixa'
import { useTurno } from '@/hooks/use-turno'
import { useProdutos } from '@/hooks/use-produtos'
import { ModalCancelamento } from '@/components/caixa/modal-cancelamento'
import { ModalPagamento } from '@/components/caixa/modal-pagamento'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const formatMoney = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_DEBITO: 'Débito',
  CARTAO_CREDITO: 'Crédito',
}

type Aba = 'fila' | 'historico'

export default function FilaCaixaPage() {
  const { fila, isLoading, isError, mutate: mutateFila } = useFilaCaixa()
  const { pedidos: historico, totalDia, totalPorForma, isLoading: loadingHistorico, mutate: mutateHistorico } = useHistoricoCaixa()
  const { status: turnoStatus } = useTurno()
  const { produtos } = useProdutos()

  const [aba, setAba] = useState<Aba>('fila')
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)
  const [pedidoCancelar, setPedidoCancelar] = useState<FilaPedidoFrontend | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isUpdatingItem, setIsUpdatingItem] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [expandedHistorico, setExpandedHistorico] = useState<string | null>(null)
  const [reabrindoId, setReabrindoId] = useState<string | null>(null)
  const [activeCardSearch, setActiveCardSearch] = useState<string | null>(null)
  const [cardSearchTerm, setCardSearchTerm] = useState('')

  const filteredCardProdutos = useMemo(() => {
    if (!activeCardSearch || !cardSearchTerm.trim()) return []
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(cardSearchTerm.toLowerCase()) && p.disponivel
    ).slice(0, 4)
  }, [produtos, activeCardSearch, cardSearchTerm])

  const filaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return fila
    return fila.filter(p =>
      p.codigo.toLowerCase().includes(q) ||
      String(p.mesa?.numero ?? '').includes(q) ||
      p.atendente.nome.toLowerCase().includes(q)
    )
  }, [fila, busca])

  const formatCompactTime = (date: Date | string) => {
    const diff = differenceInMinutes(new Date(), new Date(date))
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}h`
  }

  const getUrgencia = (date: Date | string) => {
    const min = differenceInMinutes(new Date(), new Date(date))
    if (min < 5)  return { barColor: '#10b981', badge: 'bg-emerald-50 text-emerald-700' }
    if (min < 15) return { barColor: '#f97316', badge: 'bg-orange-50 text-orange-700' }
    return          { barColor: '#f43f5e', badge: 'bg-rose-50 text-rose-700' }
  }

  const handleUpdateItemQuantity = async (
    pedidoId: string,
    produtoId: string,
    novaQuantidade: number,
    currentItens: any[]
  ) => {
    if (novaQuantidade < 0) return
    try {
      setIsUpdatingItem(`${pedidoId}-${produtoId}`)
      const item = currentItens.find(i => i.produtoId === produtoId)
      let res: Response

      if (novaQuantidade === 0) {
        res = await fetch(`/api/caixa/${pedidoId}/cancelar-item`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, motivoCancelamento: 'Alteração no caixa' })
        })
      } else {
        const diff = novaQuantidade - item.quantidade
        if (diff > 0) {
          res = await fetch(`/api/caixa/${pedidoId}/adicionar-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produtoId, quantidade: diff })
          })
        } else {
          res = await fetch(`/api/caixa/${pedidoId}/cancelar-item`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id, motivoCancelamento: 'Alteração no caixa', quantidadeCancelada: Math.abs(diff) })
          })
        }
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar item')
      }
      toast.success(novaQuantidade === 0 ? 'Item removido' : 'Quantidade atualizada')
      mutateFila()
      mutate('/api/pedidos')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdatingItem(null)
    }
  }

  const handleCancelOrder = async () => {
    if (!pedidoCancelar) return
    try {
      setIsProcessing(pedidoCancelar.id)
      const res = await fetch(`/api/pedidos/${pedidoCancelar.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao cancelar pedido')
      }
      toast.success('Pedido cancelado')
      mutateFila()
      mutate('/api/pedidos')
      setPedidoCancelar(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReabrirPedido = async (id: string) => {
    try {
      setReabrindoId(id)
      const res = await fetch(`/api/pedidos/${id}/reabrir`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao reabrir pedido')
      }
      toast.success('Pedido reaberto e movido para a fila')
      mutateFila()
      mutateHistorico()
      setExpandedHistorico(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setReabrindoId(null)
    }
  }

  const handleAddItemToCard = async (pedidoId: string, produtoId: string) => {
    try {
      setIsUpdatingItem(`${pedidoId}-add-${produtoId}`)
      const res = await fetch(`/api/caixa/${pedidoId}/adicionar-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, quantidade: 1 })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao adicionar item')
      }
      toast.success('Item adicionado')
      mutateFila()
      setCardSearchTerm('')
      setActiveCardSearch(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdatingItem(null)
    }
  }

  const totalFila = fila.reduce((acc, p) =>
    acc + p.itens.reduce((s, i) => s + Number(i.precoSnapshot) * i.quantidade, 0), 0
  )

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-zinc-200/60 px-6 lg:px-10 sticky top-0 z-10">
        <div className="h-16 flex items-center justify-between gap-6">

          {/* Esquerda: título + status */}
          <div className="flex items-center gap-4 shrink-0">
            <div>
              <h1 className="text-[15px] font-black tracking-tight text-zinc-900 leading-none">Fila do Caixa</h1>
              <div className="flex items-center gap-1.5 mt-1">
                {isError ? (
                  <><WifiOff className="w-3 h-3 text-rose-400" /><span className="text-[10px] font-semibold text-rose-400">Offline</span></>
                ) : (
                  <><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span><span className="text-[10px] font-semibold text-zinc-400">Ao vivo</span></>
                )}
              </div>
            </div>

            {/* Divisor */}
            <div className="w-px h-8 bg-zinc-200" />

            {/* Abas */}
            <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
              <button
                onClick={() => setAba('fila')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                  aba === 'fila' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Fila
                <span className={cn(
                  "min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[10px] font-black tabular-nums px-1",
                  aba === 'fila' ? "bg-zinc-900 text-white" : "bg-zinc-300/60 text-zinc-500"
                )}>
                  {fila.length}
                </span>
              </button>
              <button
                onClick={() => { setAba('historico'); mutateHistorico() }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                  aba === 'historico' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <History className="w-3.5 h-3.5" />
                Histórico
                {historico.length > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[10px] font-black tabular-nums px-1",
                    aba === 'historico' ? "bg-zinc-900 text-white" : "bg-zinc-300/60 text-zinc-500"
                  )}>
                    {historico.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Direita: busca + total */}
          <div className="flex items-center gap-3">
            {aba === 'fila' && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Código, mesa ou atendente..."
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
            )}

            {aba === 'fila' && fila.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200/60 rounded-xl shrink-0">
                <Banknote className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Em aberto</span>
                <span className="font-mono text-sm font-black text-zinc-900 tabular-nums">{formatMoney(totalFila)}</span>
              </div>
            )}

            {aba === 'historico' && totalDia > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl shrink-0">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total do dia</span>
                <span className="font-mono text-sm font-black text-emerald-700 tabular-nums">{formatMoney(totalDia)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Banner: fechamento em andamento ── */}
      {turnoStatus?.isClosingShift && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 lg:px-10 py-2.5 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[12px] font-bold text-amber-800">
            Fechamento de turno em andamento — novos pedidos estão bloqueados.
            {turnoStatus.usuarioIniciou && <span className="font-normal text-amber-600 ml-1">Iniciado por {turnoStatus.usuarioIniciou}.</span>}
          </p>
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 lg:p-8 no-scrollbar">
        <AnimatePresence mode="wait">

          {/* ABA: FILA */}
          {aba === 'fila' && (
            <motion.div
              key="fila"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-5 h-full items-start pb-4"
            >
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[300px] h-[520px] bg-white rounded-[24px] border border-zinc-200/60 animate-pulse shrink-0" />
                ))
              ) : filaFiltrada.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center">
                  {busca ? (
                    <>
                      <Search className="w-8 h-8 text-zinc-200" />
                      <p className="text-sm font-bold text-zinc-400">Nenhum pedido para <span className="text-zinc-700">"{busca}"</span></p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-3xl bg-white border border-zinc-200/60 shadow-sm flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Fila Vazia</p>
                        <p className="text-[11px] text-zinc-400 uppercase tracking-widest mt-1">Aguardando pedidos...</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                filaFiltrada.map(pedido => {
                  const totalAtivo = pedido.itens.reduce((acc, i) => acc + Number(i.precoSnapshot) * i.quantidade, 0)
                  const urg = getUrgencia(pedido.criadoEm)
                  const isLocal = pedido.tipo === 'LOCAL'

                  return (
                    <article key={pedido.id} className="shrink-0 w-[300px] flex flex-col max-h-[calc(100vh-180px)]">
                      <div className="flex flex-col bg-white rounded-[24px] shadow-sm ring-1 ring-zinc-950/[0.04] overflow-hidden relative">
                        {/* Barra de urgência lateral */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[24px]" style={{ backgroundColor: urg.barColor }} />

                        {/* Cabeçalho do card */}
                        <div className="px-5 pt-5 pb-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Hash className="w-3 h-3 text-zinc-400" strokeWidth={3} />
                              <span className="font-mono text-[11px] font-bold text-zinc-500 tracking-tight tabular-nums uppercase">{pedido.codigo}</span>
                            </div>
                            <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tabular-nums", urg.badge)}>
                              <Clock className="w-3 h-3" strokeWidth={2.5} />
                              {formatCompactTime(pedido.criadoEm)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-black tracking-tight text-zinc-900 leading-tight flex items-center gap-2">
                                {isLocal && pedido.mesa?.numero
                                  ? <><MapPin className="w-4 h-4 text-zinc-400 shrink-0" />Mesa {pedido.mesa.numero}</>
                                  : <><Bike className="w-4 h-4 text-zinc-400 shrink-0" />Balcão</>
                                }
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <UserCircle className="w-3 h-3 text-zinc-400" />
                                <span className="text-[11px] font-semibold text-zinc-400">{pedido.atendente.nome.split(' ')[0]}</span>
                                <span className={cn(
                                  "ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                  isLocal ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                )}>
                                  {isLocal ? <UtensilsCrossed className="w-2.5 h-2.5 inline" /> : <Bike className="w-2.5 h-2.5 inline" />}
                                  {' '}{isLocal ? 'Local' : 'Viagem'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {pedido.observacao && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[12px] font-semibold text-amber-800 leading-snug">{pedido.observacao}</p>
                            </div>
                          )}
                        </div>

                        {/* Itens */}
                        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-2 border-t border-zinc-100">
                          <ul className="space-y-2.5 pt-4">
                            {pedido.itens.map(item => {
                              const key = `${pedido.id}-${item.produtoId}`
                              const isUpdating = isUpdatingItem === key
                              return (
                                <li key={item.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 ring-1 ring-zinc-200/50 shrink-0">
                                      <button
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade - 1, pedido.itens)}
                                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-40"
                                      >
                                        {item.quantidade === 1 ? <Trash2 className="w-3 h-3 text-rose-500" /> : <Minus className="w-3 h-3" />}
                                      </button>
                                      <span className="w-7 text-center font-mono text-[12px] font-black text-zinc-900 tabular-nums">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantidade}
                                      </span>
                                      <button
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade + 1, pedido.itens)}
                                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-40"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="text-[13px] font-semibold text-zinc-700 truncate">{item.nomeSnapshot}</span>
                                  </div>
                                  <span className="shrink-0 font-mono text-[12px] font-bold text-zinc-400 tabular-nums">
                                    {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>

                          {/* Adicionar item ao pedido */}
                          <div className="pt-3 pb-1">
                            {activeCardSearch !== pedido.id ? (
                              <button
                                onClick={() => { setActiveCardSearch(pedido.id); setCardSearchTerm('') }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
                              >
                                <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500" />
                                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-orange-500 uppercase tracking-widest">Adicionar item</span>
                              </button>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                  <input
                                    autoFocus
                                    value={cardSearchTerm}
                                    onChange={e => setCardSearchTerm(e.target.value)}
                                    placeholder="Pesquisar produto..."
                                    className="w-full h-9 pl-9 pr-8 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                                  />
                                  <button
                                    onClick={() => { setActiveCardSearch(null); setCardSearchTerm('') }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {filteredCardProdutos.length > 0 && (
                                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-50">
                                    {filteredCardProdutos.map(p => (
                                      <button
                                        key={p.id}
                                        onClick={() => handleAddItemToCard(pedido.id, p.id)}
                                        disabled={!!isUpdatingItem}
                                        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-orange-50 transition-colors group disabled:opacity-50"
                                      >
                                        <div className="flex flex-col items-start">
                                          <span className="text-[13px] font-semibold text-zinc-800">{p.nome}</span>
                                          <span className="text-[11px] font-mono font-bold text-zinc-400">{formatMoney(Number(p.preco))}</span>
                                        </div>
                                        <Plus className="w-3.5 h-3.5 text-zinc-300 group-hover:text-orange-500" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Alerta: sem itens após cancelamentos */}
                        {pedido.itens.length === 0 && (
                          <div className="mx-5 mb-3 flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <p className="text-[11px] font-bold text-rose-700">Todos os itens foram cancelados. Cancele o pedido.</p>
                          </div>
                        )}

                        {/* Rodapé */}
                        <div className="px-5 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center gap-2">
                          <button
                            onClick={() => setPedidoCancelar(pedido)}
                            className="h-11 w-11 shrink-0 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all ring-1 ring-rose-200/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { setIsProcessing(pedido.id); setPagarPedido(pedido) }}
                            disabled={pedido.itens.length === 0 || isProcessing === pedido.id}
                            className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white flex items-center justify-between px-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isProcessing === pedido.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              <>
                                <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Receber</span>
                                <span className="font-mono text-base font-black tabular-nums tracking-tighter">{formatMoney(totalAtivo)}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </motion.div>
          )}

          {/* ABA: HISTÓRICO */}
          {aba === 'historico' && (
            <motion.div
              key="historico"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-5xl mx-auto space-y-4 pb-8"
            >
              {/* Resumo do dia */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-zinc-200/60 rounded-2xl px-5 py-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total do dia</p>
                  <p className="font-mono text-xl font-black text-zinc-900 tabular-nums">{formatMoney(totalDia)}</p>
                </div>
                <div className="bg-white border border-zinc-200/60 rounded-2xl px-5 py-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pedidos</p>
                  <p className="font-mono text-xl font-black text-zinc-900 tabular-nums">{historico.length}</p>
                </div>
                {Object.entries(totalPorForma).map(([forma, val]) => (
                  <div key={forma} className="bg-white border border-zinc-200/60 rounded-2xl px-5 py-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{FORMA_LABEL[forma] ?? forma}</p>
                    <p className="font-mono text-xl font-black text-zinc-900 tabular-nums">{formatMoney(val)}</p>
                  </div>
                ))}
              </div>

              {/* Lista */}
              {loadingHistorico ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white rounded-2xl border border-zinc-200/60 animate-pulse" />
                ))
              ) : historico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <Receipt className="w-8 h-8 text-zinc-200" />
                  <p className="text-sm font-bold text-zinc-400">Nenhum pedido pago hoje ainda.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200/60 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                  {historico.map(pedido => {
                    const isExpanded = expandedHistorico === pedido.id
                    return (
                      <div key={pedido.id}>
                        <button
                          onClick={() => setExpandedHistorico(isExpanded ? null : pedido.id)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[11px] font-bold text-zinc-400 tabular-nums uppercase w-24 text-left">{pedido.codigo}</span>
                            <span className="text-sm font-semibold text-zinc-700">{pedido.atendente.nome.split(' ')[0]}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide",
                              pedido.tipo === 'LOCAL' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                            )}>
                              {pedido.tipo === 'LOCAL' ? 'Local' : 'Viagem'}
                            </span>
                            <span className="hidden sm:block text-[11px] font-bold text-zinc-400">{FORMA_LABEL[pedido.formaPagamento ?? ''] ?? pedido.formaPagamento}</span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="hidden sm:block text-[11px] text-zinc-400 tabular-nums">{pedido.pagoEm ? format(new Date(pedido.pagoEm), 'HH:mm') : ''}</span>
                            <span className="font-mono text-sm font-black text-zinc-900 tabular-nums">{formatMoney(pedido.totalFinal)}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-100 px-6 py-4 space-y-2 bg-zinc-50/30">
                            {pedido.observacao && (
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[12px] font-semibold text-amber-800">{pedido.observacao}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                              {pedido.itens.map(item => (
                                <div key={item.id} className="flex items-center justify-between text-[13px]">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 text-center font-mono text-[11px] font-black text-zinc-500 bg-zinc-100 rounded-md py-0.5">{item.quantidade}x</span>
                                    <span className="font-semibold text-zinc-700">{item.nomeSnapshot}</span>
                                  </div>
                                  <span className="font-mono text-[12px] font-bold text-zinc-400 tabular-nums">{formatMoney(item.precoSnapshot * item.quantidade)}</span>
                                </div>
                              ))}
                            </div>
                            {pedido.totalCancelado > 0 && (
                              <p className="text-[11px] text-rose-500 font-bold pt-1">
                                Cancelado: -{formatMoney(pedido.totalCancelado)}
                              </p>
                            )}
                            <div className="pt-3 border-t border-zinc-100 mt-1">
                              <button
                                onClick={() => handleReabrirPedido(pedido.id)}
                                disabled={reabrindoId === pedido.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 text-[12px] font-bold transition-all disabled:opacity-50"
                              >
                                {reabrindoId === pedido.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <RotateCcw className="w-3.5 h-3.5" />}
                                Reabrir para edição
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Modais ── */}
      <ModalCancelamento item={null} onClose={() => {}} />
      <ModalPagamento
        pedido={pagarPedido}
        onClose={() => { setPagarPedido(null); setIsProcessing(null) }}
      />

      {/* Modal: cancelar pedido */}
      <Dialog open={!!pedidoCancelar} onOpenChange={(open) => !open && setPedidoCancelar(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center ring-1 ring-rose-100">
                <Trash2 className="w-8 h-8 text-rose-600" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">Cancelar Pedido?</DialogTitle>
                <DialogDescription className="text-zinc-500 text-[15px] leading-relaxed">
                  O pedido <span className="font-mono font-bold text-zinc-900">{pedidoCancelar?.codigo}</span> será removido permanentemente.
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleCancelOrder} disabled={isProcessing === pedidoCancelar?.id}
                className="h-14 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm uppercase tracking-widest">
                {isProcessing === pedidoCancelar?.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIM, CANCELAR'}
              </Button>
              <Button variant="ghost" onClick={() => setPedidoCancelar(null)}
                className="h-12 w-full rounded-2xl text-zinc-400 font-bold text-[11px] uppercase tracking-widest hover:text-zinc-900 hover:bg-zinc-50">
                VOLTAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
