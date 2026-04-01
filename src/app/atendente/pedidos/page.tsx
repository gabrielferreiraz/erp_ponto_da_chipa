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
  if (pedidos.length > 0 && JSON.stringify(pedidos) !== JSON.stringify(pedidosCache)) {
    setPedidosCache(pedidos)
  }
  if (pedidosCaixa.length > 0 && JSON.stringify(pedidosCaixa) !== JSON.stringify(filaCache)) {
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
    if (minDiff > 20) return 'text-[#B91C1C]' // Atrasado (Carmesim)
    if (minDiff > 10) return 'text-orange-600' // Alerta (Amarelo/Laranja)
    return 'text-emerald-600' // Recente (Verde/Zinco)
  }

  const pedidosParaExibir = pedidosCache.length > 0 ? pedidosCache : pedidos
  const filaParaExibir = filaCache.length > 0 ? filaCache : pedidosCaixa

  const pedidosAbertos = pedidosParaExibir.filter(p => p.orderStatus === 'ABERTO')

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 lg:p-14 max-w-[1600px] mx-auto transition-all duration-200 ease-in-out font-sans overflow-x-hidden pb-40 scroll-smooth">
      
      {/* Header Compacto com Filtros Interativos (Chips) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_8px_-2px_rgba(0,0,0,0.02)] border border-zinc-200/50">
            <ChefHat className="w-8 h-8 text-[#B91C1C]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
              Visão Operacional
            </h1>
          </div>
        </div>

        {/* Chips de Filtro */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1"
             style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
          <button 
            onClick={() => setActiveFilter('meus')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 min-w-fit",
              activeFilter === 'meus' 
                ? "bg-white border-zinc-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-zinc-900 ring-1 ring-zinc-950/[0.03]" 
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <span className="text-[13px] font-bold uppercase tracking-widest">Em Aberto</span>
            <span className={cn(
              "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono text-[10px] font-black tabular-nums tracking-tighter transition-colors",
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
                ? "bg-orange-50 border-orange-200/60 shadow-[0_2px_8px_-2px_rgba(234,88,12,0.1)] text-orange-700 ring-1 ring-orange-950/[0.03]" 
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <Banknote className={cn("w-4 h-4", activeFilter === 'caixa' ? "text-orange-500" : "text-zinc-400")} strokeWidth={2} />
            <span className="text-[13px] font-bold uppercase tracking-widest">Fila do Caixa</span>
            <span className={cn(
              "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono text-[10px] font-black tabular-nums tracking-tighter transition-colors",
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
              {loadingPedidos && pedidosCache.length === 0 ? (
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
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12 no-scrollbar"
                  style={{ maskImage: pedidosAbertos.length > 3 ? 'linear-gradient(to bottom, black 80%, transparent)' : 'none' }}
                >
                  {pedidosAbertos.map(pedido => (
                    <div 
                      key={pedido.id}
                      onClick={() => handleEdit(pedido)}
                      className="group bg-white ring-1 ring-zinc-950/[0.04] rounded-[28px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_24px_-6px_rgba(0,0,0,0.04)] hover:scale-[1.01] cursor-pointer flex flex-col justify-between overflow-hidden gap-6"
                    >
                      {/* Top Info - High Density */}
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

                      {/* Content - Compact */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                            <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-[#E24A07]" strokeWidth={2} />
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

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100/60 mt-2">
                        <span className="font-mono text-[22px] font-black text-zinc-900 tracking-tighter tabular-nums bg-zinc-50/80 px-3 py-1 rounded-xl">
                          {formatMoney(pedido.totalBruto)}
                        </span>
                        <button 
                          onClick={(e) => handleConfirmOrder(pedido.id, e)}
                          disabled={confirmingId === pedido.id}
                          className="h-12 px-8 rounded-2xl bg-zinc-900 text-white font-black text-[11px] uppercase tracking-widest transition-all duration-300 hover:bg-[#B91C1C] hover:shadow-[0_4px_12px_rgba(185,28,28,0.3)] hover:-translate-y-0.5 active:scale-[0.96] disabled:opacity-50 min-w-[120px] hitbox-48"
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
            >
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12 no-scrollbar"
                style={{ maskImage: filaParaExibir.length > 3 ? 'linear-gradient(to bottom, black 80%, transparent)' : 'none' }}
              >
                {loadingCaixa && filaCache.length === 0 ? (
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
                    <div key={pedido.id} className="bg-white ring-1 ring-zinc-950/[0.04] rounded-[28px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] border-l-[6px] border-l-orange-500 flex flex-col justify-between gap-6 transition-all duration-300">
                      {/* Top Info */}
                      <div className="flex justify-between items-center bg-zinc-50/50 p-3 -m-3 mb-1 rounded-2xl">
                        <span className="font-mono text-base font-black text-zinc-800 tracking-tight tabular-nums uppercase">
                          {pedido.codigo}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm ring-1 ring-zinc-100">
                          <Clock className={cn("w-3.5 h-3.5", getTimerColor(pedido.criadoEm))} strokeWidth={2.5} />
                          <span className={cn("text-[11px] font-bold tracking-tight capitalize", getTimerColor(pedido.criadoEm))}>
                            {formatTime(pedido.criadoEm)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 px-1 mt-2">
                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
                          <UserCircle className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atendente</p>
                          <p className="text-[15px] font-bold text-zinc-700 tracking-tight truncate max-w-[150px]">{pedido.atendente.nome}</p>
                        </div>
                      </div>

                      {/* Lista de Itens (O Extrato) */}
                      {pedido.itens.length > 0 && (
                        <div className="px-1 mt-1 flex flex-col gap-3 border-t border-zinc-100/80 pt-5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-60 mb-1">Resumo do Pedido</p>
                          {pedido.itens.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-[13px] group/item">
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                <span className="flex-shrink-0 bg-orange-50 text-orange-700 font-mono text-[12px] font-black px-1.5 py-0.5 rounded-lg tabular-nums tracking-tighter ring-1 ring-orange-200/50 shadow-sm">
                                  {item.quantidade}x
                                </span>
                                <span className="font-semibold text-zinc-700 tracking-tight truncate">
                                  {item.nomeSnapshot}
                                </span>
                              </div>
                              <span className="flex-shrink-0 font-mono text-[13px] font-bold text-zinc-400 tabular-nums tracking-tighter">
                                {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-100/80 mt-2">
                        <span className="font-mono text-[24px] font-black text-zinc-900 tracking-tighter tabular-nums bg-zinc-50/80 px-4 py-1.5 rounded-xl border border-zinc-100 w-fit">
                          {formatMoney(pedido.totalFinal)}
                        </span>
                        <button 
                          onClick={() => setPagarPedido(pedido)}
                          className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border border-emerald-200/60 shadow-[0_1px_2px_rgba(16,185,129,0.1)] flex items-center gap-2 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-95 hitbox-48"
                        >
                          <Banknote className="w-4 h-4" strokeWidth={2.5} /> RECEBER
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

      {/* FAB - Botão Pílula Sticky Bottom Premium */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[40] flex justify-center pb-[calc(max(2rem,env(safe-area-inset-bottom)))] px-4 pointer-events-none transition-all duration-300",
        modalOpen ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/80 to-transparent pointer-events-none h-40 bottom-0 top-auto z-[-1] backdrop-blur-[2px]" />
        
        <button 
          onClick={() => { setEditingPedido(null); setModalOpen(true); }}
          className="pointer-events-auto group relative flex items-center justify-center gap-2.5 h-16 w-full max-w-[340px] rounded-full bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white font-black text-sm uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_32px_rgba(226,74,7,0.35),0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.96] ring-1 ring-zinc-950/[0.04]"
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

