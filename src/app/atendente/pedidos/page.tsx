'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import { Plus, Clock, MapPin, ShoppingBag, Banknote, Loader2, ChefHat, AlertTriangle, Trash2, Minus } from 'lucide-react'
import { PedidoModalMobile } from '@/components/pedidos/pedido-modal-mobile'
import { usePedidosAtendente, PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { ModalPagamento } from '@/components/caixa/modal-pagamento'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
const formatTime = (date: Date | string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })

export default function PedidosAtendentePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoFrontend | null>(null)
  const { pedidos, isLoading: loadingPedidos, mutate: mutatePedidos } = usePedidosAtendente()
  const { fila: pedidosCaixa, isLoading: loadingCaixa } = useFilaCaixa()
  const [activeFilter, setActiveFilter] = useState<'meus' | 'caixa'>('meus')

  // Cache local para evitar piscadas durante re-fetch em background (SWR)
  const [pedidosCache, setPedidosCache] = useState<PedidoFrontend[]>([])
  const [filaCache, setFilaCache] = useState<FilaPedidoFrontend[]>([])

  // Atualiza cache via useEffect para não causar setState durante render.
  // Limpa cache quando dados chegam como array vazio (lista finalizada).
  useEffect(() => {
    if (pedidos !== undefined) {
      setPedidosCache(pedidos)
    }
  }, [pedidos])

  useEffect(() => {
    if (pedidosCaixa !== undefined) {
      setFilaCache(pedidosCaixa)
    }
  }, [pedidosCaixa])

  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [pedidoConfirmar, setPedidoConfirmar] = useState<PedidoFrontend | null>(null)
  const [pedidoCancelar, setPedidoCancelar] = useState<PedidoFrontend | null>(null)
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)

  const handleEdit = (pedido: PedidoFrontend) => {
    setEditingPedido(pedido)
    setModalOpen(true)
  }

  const handleConfirmOrder = async (pedido: PedidoFrontend, e: React.MouseEvent) => {
    e.stopPropagation()
    setPedidoConfirmar(pedido)
  }

  const executeConfirmOrder = async () => {
    if (!pedidoConfirmar) return

    try {
      setConfirmingId(pedidoConfirmar.id)
      const res = await fetch(`/api/pedidos/${pedidoConfirmar.id}/confirmar`, { method: 'PATCH' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao confirmar pedido')
      }
      toast.success('Pedido enviado para o Caixa!')
      mutatePedidos()
      setPedidoConfirmar(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConfirmingId(null)
    }
  }

  const [isUpdatingItem, setIsUpdatingItem] = useState<string | null>(null)

  const handleUpdateItemQuantity = async (pedidoId: string, produtoId: string, novaQuantidade: number, status: 'ABERTO' | 'AGUARDANDO_COBRANCA', currentItens: any[]) => {
    if (novaQuantidade < 0) return

    try {
      setIsUpdatingItem(`${pedidoId}-${produtoId}`)
      
      let res;
      if (status === 'ABERTO') {
        // Para pedidos ABERTO, usamos a rota de atualização de pedido padrão
        const novosItens = novaQuantidade === 0 
          ? currentItens.filter(i => i.produtoId !== produtoId).map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade }))
          : currentItens.map(i => i.produtoId === produtoId ? { produtoId, quantidade: novaQuantidade } : { produtoId: i.produtoId, quantidade: i.quantidade });

        res = await fetch(`/api/pedidos/${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itens: novosItens })
        })
      } else {
        // Para pedidos na FILA DO CAIXA, usamos as rotas específicas do caixa
        if (novaQuantidade === 0) {
          // Remover/Cancelar item
          const item = currentItens.find(i => i.produtoId === produtoId);
          res = await fetch(`/api/caixa/${pedidoId}/cancelar-item`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id, motivoCancelamento: 'Alteração no caixa' })
          })
        } else {
          const item = currentItens.find(i => i.produtoId === produtoId);
          const diff = novaQuantidade - item.quantidade;
          
          if (diff > 0) {
            // Adicionar mais
            res = await fetch(`/api/caixa/${pedidoId}/adicionar-item`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ produtoId, quantidade: diff })
            })
          } else {
            // Diminuir (Cancelar parcial)
            res = await fetch(`/api/caixa/${pedidoId}/cancelar-item`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId: item.id, motivoCancelamento: 'Alteração no caixa', quantidadeCancelada: Math.abs(diff) })
            })
          }
        }
      }

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao atualizar item')
      }

      toast.success(novaQuantidade === 0 ? 'Item removido' : 'Quantidade atualizada')
      mutatePedidos()
      mutate('/api/caixa/fila')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdatingItem(null)
    }
  }

  const handleCancelOrder = async () => {
    if (!pedidoCancelar) return

    try {
      setConfirmingId(pedidoCancelar.id)
      const res = await fetch(`/api/pedidos/${pedidoCancelar.id}`, { 
        method: 'DELETE' 
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao cancelar pedido')
      }
      
      toast.success('Pedido cancelado com sucesso!')
      mutatePedidos()
      mutate('/api/caixa/fila')
      setPedidoCancelar(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConfirmingId(null)
    }
  }
  
  const getTimerColor = (criadoEm: Date | string) => {
    const minDiff = (new Date().getTime() - new Date(criadoEm).getTime()) / 1000 / 60
    if (minDiff > 20) return 'text-[#B91C1C]' // Atrasado
    if (minDiff > 10) return 'text-orange-600' // Alerta
    return 'text-emerald-600' // Recente
  }

  const pedidosParaExibir = loadingPedidos && pedidosCache.length === 0 ? [] : pedidosCache
  const filaParaExibir = loadingCaixa && filaCache.length === 0 ? [] : filaCache

  const pedidosAbertos = pedidosParaExibir.filter(p => p.orderStatus === 'ABERTO')

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 lg:p-14 max-w-[1600px] mx-auto transition-all duration-200 ease-in-out font-sans overflow-x-hidden pb-40 scroll-smooth">
      
      {/* Header Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-200/50">
            <ChefHat className="w-8 h-8 text-[#B91C1C]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
              Visão Operacional
            </h1>
          </div>
        </div>

        {/* Chips de Filtro */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          <button 
            onClick={() => setActiveFilter('meus')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 min-w-fit",
              activeFilter === 'meus' 
                ? "bg-white border-zinc-200/80 shadow-sm text-zinc-900 ring-1 ring-zinc-950/[0.03]" 
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <span className="text-[13px] font-bold uppercase tracking-widest">Em Aberto</span>
            <span className={cn(
              "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono text-[10px] font-black tabular-nums transition-colors",
              activeFilter === 'meus' ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200/50 text-zinc-400"
            )}>
              {pedidosAbertos.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveFilter('caixa')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 min-w-fit",
              activeFilter === 'caixa' 
                ? "bg-orange-50 border-orange-200/60 shadow-sm text-orange-700 ring-1 ring-orange-950/[0.03]" 
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <Banknote className={cn("w-4 h-4", activeFilter === 'caixa' ? "text-orange-500" : "text-zinc-400")} strokeWidth={2} />
            <span className="text-[13px] font-bold uppercase tracking-widest">Fila do Caixa</span>
            <span className={cn(
              "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono text-[10px] font-black tabular-nums transition-colors",
              activeFilter === 'caixa' ? "bg-orange-200/50 text-orange-700" : "bg-zinc-200/50 text-zinc-400"
            )}>
              {filaParaExibir.length}
            </span>
          </button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeFilter === 'meus' ? (
            <motion.section 
              key="meus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {loadingPedidos && pedidosParaExibir.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-white border border-zinc-200/50 rounded-3xl animate-pulse shadow-sm" />
                  ))}
                </div>
              ) : pedidosAbertos.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-16 text-center space-y-4">
                  <div className="bg-zinc-50 p-6 rounded-full border border-zinc-100">
                    <ShoppingBag className="w-10 h-10 text-zinc-200" strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Mesa Limpa</p>
                    <p className="font-sans text-xl font-semibold text-zinc-600 tracking-tight">Zero pedidos na fila.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                  {pedidosAbertos.map(pedido => (
                    <div 
                      key={pedido.id}
                      onClick={() => handleEdit(pedido)}
                      className="group bg-white ring-1 ring-zinc-950/[0.05] rounded-[28px] shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer flex flex-col overflow-hidden"
                    >
                      {/* Cabeçalho do Card: MESA EM DESTAQUE */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 shadow-md">
                            <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-sans text-xl font-black text-zinc-900 tracking-tight leading-none">
                              {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Balcão'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-tight leading-none">
                                #{pedido.codigo}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tabular-nums shadow-sm ring-1 ring-zinc-100",
                          getTimerColor(pedido.criadoEm) === 'text-[#B91C1C]'
                            ? "bg-red-50 text-[#B91C1C]"
                            : getTimerColor(pedido.criadoEm) === 'text-orange-600'
                              ? "bg-orange-50 text-orange-600"
                              : "bg-emerald-50 text-emerald-600"
                        )}>
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {formatDistanceToNow(new Date(pedido.criadoEm), { addSuffix: false, locale: ptBR }).replace('cerca de ', '')}
                        </div>
                      </div>

                      {/* Lista de Itens (Unificado com o Caixa) */}
                      <div className="px-5 pb-4 space-y-2 border-t border-zinc-100/60">
                        <div className="pt-3 space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
                          {pedido.itens.map(item => {
                            const isUpdating = isUpdatingItem === `${pedido.id}-${item.produtoId}`
                            
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-3 group/item">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 ring-1 ring-zinc-200/50">
                                    <button
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade - 1, 'ABERTO', pedido.itens);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-50"
                                  >
                                    {item.quantidade === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="w-8 text-center font-mono text-[12px] font-black text-zinc-900 tabular-nums">
                                    {isUpdating ? '...' : item.quantidade}
                                  </span>
                                  <button
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade + 1, 'ABERTO', pedido.itens);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-50"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-semibold text-zinc-700 truncate leading-tight">
                                      {item.nomeSnapshot}
                                    </span>
                                    <span className="text-[10px] font-medium text-zinc-400 font-mono">
                                      {formatMoney(Number(item.precoSnapshot))} un.
                                    </span>
                                  </div>
                                </div>
                                <span className="shrink-0 font-mono text-[13px] font-black text-zinc-900 tabular-nums bg-zinc-50 px-2 py-1 rounded-lg">
                                  {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Rodapé: total + botão FECHAR */}
                      <div className="px-4 pb-4 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col justify-center px-4">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total</span>
                            <span className="font-mono text-xl font-black text-zinc-900 tracking-tighter tabular-nums leading-none">
                              {formatMoney(pedido.totalBruto)}
                            </span>
                          </div>
                          
                          <button 
                            onClick={(e) => handleConfirmOrder(pedido, e)}
                            disabled={confirmingId === pedido.id}
                            className="h-14 px-6 rounded-2xl bg-zinc-900 text-white font-black text-[11px] uppercase tracking-widest transition-all duration-300 hover:bg-[#B91C1C] active:scale-[0.96] disabled:opacity-50 min-w-[100px] shadow-sm flex items-center justify-center"
                          >
                            {confirmingId === pedido.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'FECHAR'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.section
              key="caixa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 pb-32"
            >
              {loadingCaixa && filaParaExibir.length === 0 ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-[180px] bg-white border border-zinc-200/50 rounded-3xl animate-pulse shadow-sm" />
                ))
              ) : filaParaExibir.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-16 text-center space-y-4">
                  <div className="bg-zinc-50 p-6 rounded-full border border-zinc-100">
                    <Banknote className="w-10 h-10 text-zinc-200" strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Caixa Limpo</p>
                    <p className="font-sans text-xl font-semibold text-zinc-600 tracking-tight">Nenhum pedido aguardando pagamento.</p>
                  </div>
                </div>
              ) : (
                filaParaExibir.map(pedido => (
                  <div
                    key={pedido.id}
                    onClick={() => handleEdit(pedido as any)}
                    className="bg-white rounded-[28px] shadow-sm ring-1 ring-zinc-950/[0.05] overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
                  >
                    {/* Topo: MESA EM DESTAQUE */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md">
                          <Banknote className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-sans text-xl font-black text-zinc-900 tracking-tight leading-none">
                            {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Balcão'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-tight leading-none">
                              #{pedido.codigo}
                            </span>
                            {pedido.atendente?.nome && (
                              <span className="text-[10px] text-zinc-300 font-medium leading-none">
                                · {pedido.atendente.nome.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tabular-nums shadow-sm ring-1 ring-zinc-100",
                        getTimerColor(pedido.criadoEm) === 'text-[#B91C1C]'
                          ? "bg-red-50 text-[#B91C1C]"
                          : getTimerColor(pedido.criadoEm) === 'text-orange-600'
                            ? "bg-orange-50 text-orange-600"
                            : "bg-emerald-50 text-emerald-600"
                      )}>
                        <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {formatDistanceToNow(new Date(pedido.criadoEm), { addSuffix: false, locale: ptBR }).replace('cerca de ', '')}
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="px-5 pb-4 space-y-2 border-t border-zinc-100/60">
                      <div className="pt-3 space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
                        {pedido.itens.map(item => {
                          const isUpdating = isUpdatingItem === `${pedido.id}-${item.produtoId}`
                          
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 group/item">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 ring-1 ring-zinc-200/50">
                                  <button
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade - 1, 'AGUARDANDO_COBRANCA', pedido.itens);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-50"
                                  >
                                    {item.quantidade === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="w-8 text-center font-mono text-[12px] font-black text-zinc-900 tabular-nums">
                                    {isUpdating ? '...' : item.quantidade}
                                  </span>
                                  <button
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateItemQuantity(pedido.id, item.produtoId, item.quantidade + 1, 'AGUARDANDO_COBRANCA', pedido.itens);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-zinc-500 transition-all disabled:opacity-50"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[13px] font-semibold text-zinc-700 truncate leading-tight">
                                    {item.nomeSnapshot}
                                  </span>
                                  <span className="text-[10px] font-medium text-zinc-400 font-mono">
                                    {formatMoney(Number(item.precoSnapshot))} un.
                                  </span>
                                </div>
                              </div>
                              <span className="shrink-0 font-mono text-[13px] font-black text-zinc-900 tabular-nums bg-zinc-50 px-2 py-1 rounded-lg">
                                {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Rodapé: total + botões */}
                    <div className="px-4 pb-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPedidoCancelar(pedido as any);
                          }}
                          className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all shadow-sm ring-1 ring-rose-200/50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPagarPedido(pedido);
                          }}
                          className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white flex items-center justify-between px-5 transition-all shadow-sm"
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">Receber</span>
                            <span className="font-mono text-xl font-black tabular-nums tracking-tighter leading-none">
                              {formatMoney(pedido.totalFinal)}
                            </span>
                          </div>
                          <Banknote className="w-5 h-5 opacity-50" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[40] flex justify-center pb-[calc(max(1.5rem,env(safe-area-inset-bottom)))] px-4 pointer-events-none transition-all duration-500",
        modalOpen ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/60 to-transparent pointer-events-none h-32 bottom-0 top-auto z-[-1] backdrop-blur-[4px] [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
        
        <button 
          onClick={() => { setEditingPedido(null); setModalOpen(true); }}
          className="pointer-events-auto group relative flex items-center justify-center gap-2.5 h-16 w-full max-w-[340px] rounded-full bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.96] ring-1 ring-zinc-950/[0.04]"
        >
          <Plus className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" strokeWidth={3} />
          NOVO PEDIDO
        </button>
      </div>

      <PedidoModalMobile 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        pedidoEdicao={editingPedido}
      />
      <ModalPagamento 
        pedido={pagarPedido} 
        onClose={() => setPagarPedido(null)} 
      />

      {/* Modal de Confirmação de Fechamento */}
      <Dialog open={!!pedidoConfirmar} onOpenChange={(open) => !open && setPedidoConfirmar(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="relative p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center ring-1 ring-orange-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-orange-600" strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">
                  Fechar Pedido?
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-[15px] leading-relaxed">
                  O pedido <span className="font-mono font-bold text-zinc-900">{pedidoConfirmar?.codigo}</span> será enviado para o caixa para pagamento. Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={executeConfirmOrder}
                disabled={confirmingId !== null}
                className="h-14 w-full rounded-2xl bg-zinc-900 hover:bg-[#B91C1C] text-white font-bold text-sm uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
              >
                {confirmingId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIM, ENVIAR AO CAIXA'}
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setPedidoConfirmar(null)}
                className="h-12 w-full rounded-2xl text-zinc-400 font-bold text-[11px] uppercase tracking-widest hover:text-zinc-900 hover:bg-zinc-50"
              >
                CANCELAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={!!pedidoCancelar} onOpenChange={(open) => !open && setPedidoCancelar(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="relative p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center ring-1 ring-rose-100 shadow-sm">
                <Trash2 className="w-8 h-8 text-rose-600" strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">
                  Cancelar Pedido?
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-[15px] leading-relaxed">
                  O pedido <span className="font-mono font-bold text-zinc-900">{pedidoCancelar?.codigo}</span> será removido permanentemente. Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={handleCancelOrder}
                disabled={confirmingId !== null}
                className="h-14 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
              >
                {confirmingId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIM, CANCELAR AGORA'}
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setPedidoCancelar(null)}
                className="h-12 w-full rounded-2xl text-zinc-400 font-bold text-[11px] uppercase tracking-widest hover:text-zinc-900 hover:bg-zinc-50"
              >
                VOLTAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
