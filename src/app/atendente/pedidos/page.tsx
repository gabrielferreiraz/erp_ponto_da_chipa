'use client'

import { useState } from 'react'
import { Plus, Clock, MapPin, Package, ShoppingBag, Banknote, Loader2, UserCircle, ChefHat } from 'lucide-react'
import { PedidoModalMobile } from '@/components/pedidos/pedido-modal-mobile'
import { usePedidosAtendente, PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { ModalPagamento } from '@/components/caixa/modal-pagamento'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function PedidosAtendentePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoFrontend | null>(null)
  const { pedidos, isLoading: loadingPedidos, mutate: mutatePedidos } = usePedidosAtendente()
  const { fila: pedidosCaixa, isLoading: loadingCaixa } = useFilaCaixa()
  const [activeFilter, setActiveFilter] = useState<'meus' | 'caixa'>('meus')

  // Cache local para evitar piscadas durante re-fetch em background (SWR)
  const [pedidosCache, setPedidosCache] = useState<PedidoFrontend[]>([])
  const [filaCache, setFilaCache] = useState<FilaPedidoFrontend[]>([])

  // Atualiza cache apenas quando os dados novos chegam com sucesso
  if (pedidos && pedidos.length > 0 && JSON.stringify(pedidos) !== JSON.stringify(pedidosCache)) {
    setPedidosCache(pedidos)
  }
  if (pedidosCaixa && pedidosCaixa.length > 0 && JSON.stringify(pedidosCaixa) !== JSON.stringify(filaCache)) {
    setFilaCache(pedidosCaixa)
  }

  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)

  const handleEdit = (pedido: PedidoFrontend) => {
    if (pedido.orderStatus !== 'ABERTO') {
      toast.error('Apenas pedidos em status ABERTO podem ser editados.')
      return
    }
    setEditingPedido(pedido)
    setModalOpen(true)
  }

  const handleConfirmOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!window.confirm('Enviar este pedido para o caixa?')) {
      return
    }

    try {
      setConfirmingId(id)
      const res = await fetch(`/api/pedidos/${id}/confirmar`, { method: 'PATCH' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao confirmar pedido')
      }
      toast.success('Pedido enviado para o Caixa!')
      mutatePedidos()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConfirmingId(null)
    }
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const formatTime = (date: Date | string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  
  const getTimerColor = (criadoEm: Date | string) => {
    const minDiff = (new Date().getTime() - new Date(criadoEm).getTime()) / 1000 / 60
    if (minDiff > 20) return 'text-[#B91C1C]' // Atrasado
    if (minDiff > 10) return 'text-orange-600' // Alerta
    return 'text-emerald-600' // Recente
  }

  const pedidosParaExibir = pedidosCache.length > 0 ? pedidosCache : (pedidos || [])
  const filaParaExibir = filaCache.length > 0 ? filaCache : (pedidosCaixa || [])

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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12 no-scrollbar">
                  {pedidosAbertos.map(pedido => (
                    <div 
                      key={pedido.id}
                      onClick={() => handleEdit(pedido)}
                      className="group bg-white ring-1 ring-zinc-950/[0.04] rounded-[28px] p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer flex flex-col justify-between overflow-hidden gap-6"
                    >
                      <div className="flex justify-between items-center bg-zinc-50/50 p-3 -m-3 mb-1 rounded-2xl">
                        <span className="font-mono text-base font-black text-zinc-800 tracking-tight tabular-nums uppercase">
                          {pedido.codigo}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm ring-1 ring-zinc-100">
                          <Clock className={cn("w-3.5 h-3.5", getTimerColor(pedido.criadoEm))} strokeWidth={2.5} />
                          <span className={cn("text-sm font-bold tracking-tight capitalize", getTimerColor(pedido.criadoEm))}>
                            {formatTime(pedido.criadoEm)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
                            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={2} />
                          </div>
                          <span className="font-sans text-xl font-bold text-zinc-900 tracking-tight">
                            {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Balcão'}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-semibold text-zinc-400 block mb-0.5 uppercase tracking-widest">Resumo</span>
                          <span className="text-sm font-bold text-zinc-600">
                            {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100/60 mt-2">
                        <span className="font-mono text-[22px] font-black text-zinc-900 tracking-tighter tabular-nums bg-zinc-50/80 px-3 py-1 rounded-xl">
                          {formatMoney(pedido.totalBruto)}
                        </span>
                        <button 
                          onClick={(e) => handleConfirmOrder(pedido.id, e)}
                          disabled={confirmingId === pedido.id}
                          className="h-12 px-8 rounded-2xl bg-zinc-900 text-white font-black text-[11px] uppercase tracking-widest transition-all duration-300 hover:bg-[#B91C1C] active:scale-[0.96] disabled:opacity-50 min-w-[120px]"
                        >
                          {confirmingId === pedido.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'FECHAR'}
                        </button>
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
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 no-scrollbar">
                {loadingCaixa && filaParaExibir.length === 0 ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-white border border-zinc-200/50 rounded-3xl animate-pulse shadow-sm" />
                  ))
                ) : filaParaExibir.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-16 text-center space-y-4">
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
                      className="group relative bg-white ring-1 ring-zinc-950/[0.04] rounded-[28px] p-5 shadow-sm border-l-[6px] border-l-orange-500/80 flex flex-col justify-between gap-5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center bg-zinc-50/50 p-3 -m-2 mb-0 rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1">Pedido</span>
                          <span className="font-mono text-sm font-black text-zinc-800 tracking-tight tabular-nums uppercase">
                            #{pedido.codigo}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1 text-right">Espera</span>
                          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg shadow-sm ring-1 ring-zinc-100">
                            <Clock className={cn("w-3 h-3", getTimerColor(pedido.criadoEm))} strokeWidth={2.5} />
                            <span className={cn("text-[10px] font-black tracking-tight tabular-nums", getTimerColor(pedido.criadoEm))}>
                              {formatDistanceToNow(new Date(pedido.criadoEm), { addSuffix: false, locale: ptBR }).replace('cerca de ', '')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-9 h-9 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
                          <UserCircle className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Responsável</p>
                          <p className="text-[13px] font-bold text-zinc-700 tracking-tight truncate">{pedido.atendente.nome.split(' ')[0]}</p>
                        </div>
                      </div>

                      <div className="px-1 space-y-2 border-t border-zinc-100/80 pt-4 max-h-[140px] overflow-y-auto no-scrollbar">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400/80 mb-2 flex items-center gap-2">
                          <Package className="w-3 h-3" /> Itens do Pedido
                        </p>
                        {pedido.itens.map(item => (
                          <div key={item.id} className="flex items-start justify-between text-[12px] py-0.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="flex-shrink-0 bg-zinc-100 text-zinc-600 font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md tabular-nums tracking-tighter ring-1 ring-zinc-200/50">
                                {item.quantidade}x
                              </span>
                              <span className="font-semibold text-zinc-600 tracking-tight truncate mt-0.5">
                                {item.nomeSnapshot}
                              </span>
                            </div>
                            <span className="flex-shrink-0 font-mono text-[11px] font-bold text-zinc-400 tabular-nums tracking-tighter mt-0.5 ml-2">
                              {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100/80 mt-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Total Final</span>
                          <span className="font-mono text-xl font-black text-zinc-900 tracking-tighter tabular-nums bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-100">
                            {formatMoney(pedido.totalFinal)}
                          </span>
                        </div>
                        <button 
                          onClick={() => setPagarPedido(pedido)}
                          className="h-11 px-5 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 transition-all hover:bg-emerald-500 active:scale-95"
                        >
                          <Banknote className="w-4 h-4" strokeWidth={2.5} /> 
                          <span>RECEBER</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
    </div>
  )
}
