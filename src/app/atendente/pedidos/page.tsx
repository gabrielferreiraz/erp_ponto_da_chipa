'use client'

import { useState } from 'react'
import { Plus, Clock, MapPin, Package, ArrowRight, ShoppingBag, Banknote, Loader2, UserCircle } from 'lucide-react'
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header com Botão de Novo Pedido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Gestão de Pedidos</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Acompanhamento em tempo real</p>
        </div>
        <Button 
          onClick={() => { setEditingPedido(null); setModalOpen(true); }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          NOVO PEDIDO
        </Button>
      </div>

      <Tabs defaultValue="meus" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
          <TabsTrigger value="meus" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
            Meus Pedidos ({pedidosAbertos.length + pedidosAguardando.length})
          </TabsTrigger>
          <TabsTrigger value="caixa" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
            Fila do Caixa ({pedidosCaixa.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-8 mt-6">
          {/* Seção de Pedidos em Aberto */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Em Aberto ({pedidosAbertos.length})</h2>
            </div>
            
            {loadingPedidos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-200 rounded-2xl animate-pulse" />)}
              </div>
            ) : pedidosAbertos.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Nenhum pedido em aberto</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pedidosAbertos.map(pedido => (
                  <div 
                    key={pedido.id}
                    onClick={() => handleEdit(pedido)}
                    className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-red-600/50 hover:shadow-xl hover:shadow-red-600/5 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-zinc-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-black text-zinc-900 tracking-tight">{pedido.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">{formatTime(pedido.criadoEm)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-xl">
                          <MapPin className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-black text-zinc-900 uppercase">{pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Balcão'}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-zinc-100 p-2 rounded-xl">
                          <Package className="w-4 h-4 text-zinc-600" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500">{pedido.itens.length} itens no pedido</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-zinc-50 pt-4">
                      <span className="text-lg font-black text-zinc-900 tracking-tight">{formatMoney(pedido.totalBruto)}</span>
                      <Button 
                        size="sm"
                        onClick={(e) => handleConfirmOrder(pedido.id, e)}
                        disabled={confirmingId === pedido.id}
                        className="bg-zinc-900 hover:bg-red-600 text-white font-bold rounded-xl h-9 px-4 transition-colors"
                      >
                        {confirmingId === pedido.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'FECHAR'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Seção Aguardando Cobrança */}
          {pedidosAguardando.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">No Caixa ({pedidosAguardando.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                {pedidosAguardando.map(pedido => (
                  <div key={pedido.id} className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black text-zinc-400 tracking-tight uppercase">{pedido.codigo}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{formatTime(pedido.criadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Banknote className="w-4 h-4" />
                      <span className="text-sm font-bold uppercase tracking-tight">Aguardando Pagamento</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="caixa" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loadingCaixa ? (
              [1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-200 rounded-2xl animate-pulse" />)
            ) : pedidosCaixa.length === 0 ? (
              <div className="col-span-full bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Fila do caixa vazia</p>
              </div>
            ) : (
              pedidosCaixa.map(pedido => (
                <div key={pedido.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-red-600">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-zinc-900 tracking-tight">{pedido.codigo}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{formatTime(pedido.criadoEm)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-600 uppercase">Atendente: {pedido.atendente.nome}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-zinc-900 tracking-tight">{formatMoney(pedido.totalFinal)}</span>
                      <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">No Caixa</div>
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
