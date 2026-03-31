'use client'

import { useState } from 'react'
import { Plus, Clock, MapPin, Package, ArrowRight, ShoppingBag, Banknote, Loader2, UserCircle, ChefHat } from 'lucide-react'
import { PedidoModalMobile } from '@/components/pedidos/pedido-modal-mobile'
import { usePedidosAtendente, PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { useFilaCaixa } from '@/hooks/use-fila-caixa'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PedidosAtendentePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoFrontend | null>(null)
  const { pedidos, isLoading: loadingPedidos, mutate: mutatePedidos } = usePedidosAtendente()
  const { fila: pedidosCaixa, isLoading: loadingCaixa } = useFilaCaixa()

  const [confirmingId, setConfirmingId] = useState<string | null>(null)

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

  const pedidosAbertos = pedidos.filter(p => p.orderStatus === 'ABERTO')
  const pedidosAguardando = pedidos.filter(p => p.orderStatus === 'AGUARDANDO_COBRANCA')

  return (
    <div className="min-h-screen bg-zinc-50 p-8 sm:p-12 lg:p-16 max-w-[1600px] mx-auto space-y-12 transition-all duration-200 ease-in-out">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-white p-4 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] border border-zinc-200/50">
            <ChefHat className="w-10 h-10 text-[#B91C1C]" strokeWidth={1.2} />
          </div>
          <div className="space-y-1">
            <h1 className="font-sans text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
              Pedidos
            </h1>
            <p className="text-[13px] font-medium text-zinc-400 uppercase tracking-[0.2em]">
              Fluxo Operacional
            </p>
          </div>
        </div>

        <button 
          onClick={() => { setEditingPedido(null); setModalOpen(true); }}
          className="group relative flex items-center justify-center gap-3 h-14 px-10 rounded-2xl bg-gradient-to-br from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white font-bold text-sm tracking-tight shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 ease-in-out hover:opacity-95 hover:shadow-xl active:scale-[0.97] w-full md:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
          NOVO PEDIDO
        </button>
      </div>

      <Tabs defaultValue="meus" className="w-full space-y-12">
        {/* Navegação de Abas Premium - Pill Style */}
        <TabsList className="flex items-center gap-2 bg-zinc-200/30 p-1.5 rounded-2xl w-fit border border-zinc-200/50 backdrop-blur-sm">
          <TabsTrigger 
            value="meus" 
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-zinc-500 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-[0_2px_4px_rgba(0,0,0,0.05)] data-[state=active]:border data-[state=active]:border-zinc-200/50 hover:text-zinc-700"
          >
            Meus Pedidos 
            <span className="ml-2.5 px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-400 tabular-nums">
              {pedidosAbertos.length + pedidosAguardando.length}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="caixa" 
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-zinc-500 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-[0_2px_4px_rgba(0,0,0,0.05)] data-[state=active]:border data-[state=active]:border-zinc-200/50 hover:text-zinc-700"
          >
            Fila do Caixa
            <span className="ml-2.5 px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-400 tabular-nums">
              {pedidosCaixa.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-16 m-0 outline-none animate-in fade-in-50 duration-500">
          {/* Seção de Pedidos em Aberto */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E24A07] shadow-[0_0_10px_#E24A07]" />
              <h2 className="font-sans text-sm font-semibold text-zinc-400 uppercase tracking-[0.15em]">
                Em Aberto
              </h2>
            </div>
            
            {loadingPedidos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-56 bg-white border border-zinc-200/50 rounded-2xl animate-pulse shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]" />
                ))}
              </div>
            ) : pedidosAbertos.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-24 text-center space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="bg-zinc-50 p-8 rounded-full border border-zinc-100">
                  <ShoppingBag className="w-12 h-12 text-zinc-200" strokeWidth={1} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-zinc-400 uppercase tracking-widest">Sem Movimentação</p>
                  <p className="font-sans text-2xl font-medium text-zinc-600 tracking-tight">Nenhum pedido em aberto agora.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pedidosAbertos.map(pedido => (
                  <div 
                    key={pedido.id}
                    onClick={() => handleEdit(pedido)}
                    className="group bg-white border border-zinc-200/50 rounded-2xl p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out hover:shadow-xl hover:border-zinc-300/50 cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[240px]"
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-100">
                          <span className="font-mono text-xs font-bold text-zinc-500 tracking-tighter tabular-nums uppercase">{pedido.codigo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-tighter">{formatTime(pedido.criadoEm)}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                            <MapPin className="w-5 h-5 text-zinc-400 group-hover:text-[#E24A07] transition-colors" strokeWidth={1.5} />
                          </div>
                          <span className="font-sans text-xl font-medium text-zinc-900 tracking-tight">
                            {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Balcão'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                            <Package className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                          </div>
                          <span className="text-[14px] font-medium text-zinc-500">
                            {pedido.itens.length} {pedido.itens.length === 1 ? 'item registrado' : 'itens registrados'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-zinc-100/50 pt-6">
                      <span className="font-mono text-3xl font-bold text-zinc-900 tracking-tighter tabular-nums">
                        {formatMoney(pedido.totalBruto)}
                      </span>
                      <button 
                        onClick={(e) => handleConfirmOrder(pedido.id, e)}
                        disabled={confirmingId === pedido.id}
                        className="h-11 px-8 rounded-xl bg-zinc-900 text-white font-bold text-[11px] uppercase tracking-[0.1em] transition-all duration-300 hover:bg-[#B91C1C] hover:shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {confirmingId === pedido.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'FECHAR'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Seção Aguardando Cobrança Premium */}
          {pedidosAguardando.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                <h2 className="font-sans text-sm font-semibold text-zinc-400 uppercase tracking-[0.15em]">
                  No Caixa
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pedidosAguardando.map(pedido => (
                  <div key={pedido.id} className="bg-white/40 border border-zinc-200/30 rounded-2xl p-8 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 hover:bg-white hover:border-zinc-200">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-mono text-xs font-bold text-zinc-400 tracking-tighter tabular-nums uppercase">{pedido.codigo}</span>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">{formatTime(pedido.criadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                        <Banknote className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">Processando Pagamento</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="caixa" className="m-0 outline-none animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingCaixa ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-white border border-zinc-200/50 rounded-2xl animate-pulse shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]" />
              ))
            ) : pedidosCaixa.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-24 text-center space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="bg-zinc-50 p-8 rounded-full border border-zinc-100">
                  <Banknote className="w-12 h-12 text-zinc-200" strokeWidth={1} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-zinc-400 uppercase tracking-widest">Fila do Caixa</p>
                  <p className="font-sans text-2xl font-medium text-zinc-600 tracking-tight">Nenhum pedido aguardando pagamento.</p>
                </div>
              </div>
            ) : (
              pedidosCaixa.map(pedido => (
                <div key={pedido.id} className="group bg-white border border-zinc-200/50 rounded-2xl p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] border-l-[6px] border-l-[#B91C1C] transition-all duration-300 hover:shadow-xl hover:bg-zinc-50/50">
                  <div className="flex justify-between items-start mb-8">
                    <span className="font-mono text-xs font-bold text-zinc-900 tracking-tighter tabular-nums uppercase">{pedido.codigo}</span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">{formatTime(pedido.criadoEm)}</span>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="bg-zinc-100 p-3 rounded-2xl border border-zinc-200/50">
                        <UserCircle className="w-6 h-6 text-zinc-400" strokeWidth={1.2} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atendente</p>
                        <p className="text-sm font-semibold text-zinc-700 tracking-tight">{pedido.atendente.nome}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100/50 pt-6">
                      <span className="font-mono text-3xl font-bold text-zinc-900 tracking-tighter tabular-nums">
                        {formatMoney(pedido.totalFinal)}
                      </span>
                      <div className="bg-red-50 text-[#B91C1C] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-red-100/50 shadow-sm">
                        No Caixa
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PedidoModalMobile 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        pedidoEdicao={editingPedido}
      />
    </div>
  )
}
