'use client'

import { useState, useEffect } from 'react'
import { Plus, Clock, MapPin, ShoppingBag, Banknote, Loader2, ChefHat, AlertTriangle } from 'lucide-react'
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
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)

  const handleEdit = (pedido: PedidoFrontend) => {
    if (pedido.orderStatus !== 'ABERTO') {
      toast.error('Apenas pedidos em status ABERTO podem ser editados.')
      return
    }
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

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const formatTime = (date: Date | string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  
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
                          onClick={(e) => handleConfirmOrder(pedido, e)}
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
                    className="bg-white rounded-[24px] shadow-sm ring-1 ring-zinc-950/[0.05] overflow-hidden"
                  >
                    {/* Topo: código + timer */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="font-mono text-lg font-black text-zinc-900 tracking-tight leading-none">
                            {pedido.codigo}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5 truncate max-w-[120px]">
                            {pedido.mesa ? `Mesa ${pedido.mesa.numero}` : 'Balcão'} · {pedido.atendente.nome.split(' ')[0]}
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tabular-nums",
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
                    <div className="px-5 pb-4 space-y-2 border-t border-zinc-100">
                      <div className="pt-3 space-y-2 max-h-[132px] overflow-y-auto no-scrollbar">
                        {pedido.itens.map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-zinc-100 rounded-lg font-mono text-[11px] font-black text-zinc-600 tabular-nums">
                                {item.quantidade}
                              </span>
                              <span className="text-[13px] font-semibold text-zinc-700 truncate leading-tight">
                                {item.nomeSnapshot}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-[12px] font-bold text-zinc-400 tabular-nums">
                              {formatMoney(Number(item.precoSnapshot) * item.quantidade)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rodapé: total + botão */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setPagarPedido(pedido)}
                        className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white flex items-center justify-between px-5 transition-all shadow-sm"
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Receber</span>
                        <span className="font-mono text-xl font-black tabular-nums tracking-tighter">
                          {formatMoney(pedido.totalFinal)}
                        </span>
                      </button>
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
    </div>
  )
}
