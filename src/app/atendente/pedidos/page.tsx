'use client'

import { useState } from 'react'
import { Plus, Search, Clock, MapPin, Package, Check, ArrowRight, LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { PedidoModalMobile } from '@/components/pedidos/pedido-modal-mobile'
import { usePedidosAtendente, PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PedidosAtendentePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoFrontend | null>(null)
  const { pedidos, isLoading, isError, mutate } = usePedidosAtendente()

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
    e.stopPropagation() // Evita clicar no card e abrir a edição
    
    if (!window.confirm('Tem certeza que deseja enviar este pedido para o caixa? Ele não poderá mais ser alterado.')) {
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
      mutate()
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
    <div className="min-h-[100dvh] bg-zinc-100 flex justify-center">
      <div className="w-full max-w-md bg-zinc-50/50 flex flex-col relative shadow-2xl overflow-hidden min-h-[100dvh] pb-24">
      
        {/* AppBar Mobile */}
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center gap-3">
        <div className="flex flex-1 bg-zinc-100 rounded-lg p-1">
          <button className="flex-1 rounded-md bg-white py-1.5 text-sm font-bold shadow-sm ring-1 ring-zinc-900/5 transition-all text-zinc-900">
            Abertos <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-100 text-xs font-semibold">{pedidosAbertos.length}</span>
          </button>
          <button className="flex-1 rounded-md py-1.5 text-sm font-medium text-zinc-500 transition-all">
            No Caixa <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-200 text-xs text-zinc-600 font-semibold">{pedidosAguardando.length}</span>
          </button>
        </div>
        <button 
           onClick={() => logoutAction()}
           className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0 border border-red-100 shadow-sm"
           title="Sair do sistema"
        >
           <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 p-4 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center pt-20 text-zinc-400">
            <span className="animate-spin h-8 w-8 border-2 border-zinc-400 border-t-transparent rounded-full mb-4"></span>
            Carregando seus pedidos...
          </div>
        )}

        {!isLoading && !isError && pedidosAbertos.length === 0 && (
           <div className="text-center pt-20 px-8 text-zinc-400">
             <Package className="h-12 w-12 mx-auto mb-4 text-zinc-200" />
             <p className="font-medium text-zinc-500">Nenhum pedido em aberto.</p>
             <p className="text-sm mt-1">Toque no botão abaixo para criar um novo pedido pro salão.</p>
           </div>
        )}

        {pedidosAbertos.map(pedido => (
          <div 
            key={pedido.id} 
            className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => handleEdit(pedido)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={pedido.tipo === 'LOCAL' ? 'default' : 'secondary'} className="rounded-sm font-bold shadow-sm">
                  {pedido.tipo === 'LOCAL' ? <MapPin className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                  {pedido.tipo}
                </Badge>
                <span className="text-sm font-bold text-zinc-800">{pedido.codigo}</span>
              </div>
              <div className="flex items-center text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(pedido.criadoEm)}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {pedido.itens.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-600 truncate mr-4"><span className="text-zinc-400 mr-1">{item.quantidade}x</span> {item.nomeSnapshot}</span>
                  <span className="font-medium text-zinc-900 shrink-0">{formatMoney(item.precoSnapshot * item.quantidade)}</span>
                </div>
              ))}
              {pedido.itens.length > 3 && (
                <div className="text-xs text-zinc-400 font-medium">
                  + {pedido.itens.length - 3} outros itens...
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
               <div>
                  <p className="text-xs text-zinc-400 font-medium mb-0.5">Total Parcial</p>
                  <p className="text-lg font-bold text-zinc-900 leading-none">{formatMoney(pedido.totalBruto)}</p>
               </div>
               
               <Button 
                  size="sm" 
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 px-4 h-9"
                  onClick={(e) => handleConfirmOrder(pedido.id, e)}
                  disabled={confirmingId === pedido.id}
               >
                 {confirmingId === pedido.id ? <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full"></span> : (
                   <>Enviar <ArrowRight className="h-4 w-4 ml-1" /></>
                 )}
               </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none z-20">
        <Button 
          className="w-full h-14 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-lg font-bold uppercase pointer-events-auto bg-zinc-900 hover:bg-zinc-800"
          onClick={() => {
            setEditingPedido(null)
            setModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-6 w-6" /> Novo Pedido
        </Button>
      </div>

      {modalOpen && (
        <PedidoModalMobile 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          pedidoEdicao={editingPedido}
        />
      )}
      </div>
    </div>
  )
}
