'use client'

import { useState } from 'react'
import { Plus, Clock, MapPin, Package, ArrowRight, LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { PedidoModalMobile } from '@/components/pedidos/pedido-modal-mobile'
import { usePedidosAtendente, PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { Button } from '@/components/ui/button'
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
    <>
      <style jsx global>{`
        ::selection {
          background: #ffe4cc;
          color: #9a3412;
        }
        @keyframes shimmer {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 140% 0%;
          }
        }
        .shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(231, 233, 237, 0.2) 0%,
            rgba(231, 233, 237, 0.9) 35%,
            rgba(231, 233, 237, 0.2) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(228, 228, 231, 0.5);
          border-radius: 999px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(228, 228, 231, 0.5) transparent;
        }
      `}</style>

      <div className="relative flex min-h-[100dvh] justify-center bg-[#FAFAFA] selection:bg-orange-100 selection:text-orange-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [background-position:center] opacity-[0.25]"
        />

        <div className="relative z-10 flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#FAFAFA] pb-32 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]">
      
        {/* AppBar Mobile */}
      <div className="sticky top-0 z-10 flex items-center gap-8 border-b border-zinc-950/[0.03] bg-white/80 px-8 py-6 backdrop-blur-xl ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] sm:px-12 sm:py-8">
        <div className="flex flex-1 rounded-2xl bg-zinc-100/80 p-1 ring-1 ring-zinc-950/[0.04]">
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-zinc-900 leading-[1.2] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 active:scale-[0.97]"
          >
            Abertos{' '}
            <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs tabular-nums tracking-tighter text-zinc-700">
              {pedidosAbertos.length}
            </span>
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-medium leading-[1.2] text-zinc-500 transition-all duration-200 ease-in-out hover:bg-white/60 hover:translate-y-[-2px] hover:brightness-110 active:scale-[0.97]"
          >
            No Caixa{' '}
            <span className="ml-1.5 rounded-full bg-zinc-200/80 px-2 py-0.5 font-mono text-xs tabular-nums tracking-tighter text-zinc-600">
              {pedidosAguardando.length}
            </span>
          </button>
        </div>
        <button 
           onClick={() => logoutAction()}
           className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-950/[0.06] bg-white text-[#B91C1C] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-50 hover:brightness-110 active:scale-[0.97]"
           title="Sair do sistema"
        >
           <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 space-y-8 p-8 sm:p-12">
        {isLoading && (
          <div className="pt-20">
            <div className="mb-8 h-6 w-2/3 rounded-2xl shimmer" />
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-950/[0.06] bg-white p-8 ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between gap-8">
                    <div className="h-5 w-24 rounded-full shimmer" />
                    <div className="h-6 w-28 rounded-full shimmer" />
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="h-4 w-1/2 rounded-2xl shimmer" />
                    <div className="h-4 w-2/3 rounded-2xl shimmer" />
                    <div className="h-4 w-1/3 rounded-2xl shimmer" />
                  </div>
                  <div className="mt-8 h-10 w-full rounded-2xl shimmer" />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center text-[13px] font-medium leading-[1.2] tracking-tight text-zinc-500">
              Carregando seus pedidos...
            </div>
          </div>
        )}

        {!isLoading && !isError && pedidosAbertos.length === 0 && (
           <div className="rounded-2xl border border-dashed border-zinc-950/[0.06] bg-white px-8 py-24 text-center text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] sm:px-12">
             <Package className="mx-auto mb-6 h-12 w-12 text-zinc-200" strokeWidth={1} />
             <p className="font-sans text-lg font-semibold leading-[1.2] tracking-tight text-zinc-600">Nenhum pedido em aberto.</p>
             <p className="mt-1 text-[13px] font-medium text-zinc-500">Toque no botão abaixo para criar um novo pedido pro salão.</p>
           </div>
        )}

        {pedidosAbertos.map(pedido => (
          <div 
            key={pedido.id} 
            className="cursor-pointer rounded-2xl border border-zinc-950/[0.06] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-50/50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_24px_-6px_rgba(0,0,0,0.04)] active:scale-[0.97]"
            onClick={() => handleEdit(pedido)}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-8">
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-1',
                    'text-[11px] font-bold uppercase tracking-widest',
                    'ring-1 ring-zinc-950/[0.04]',
                    pedido.tipo === 'LOCAL'
                      ? 'bg-[#B91C1C]/10 text-[#B91C1C]'
                      : 'bg-zinc-100 text-zinc-700',
                  ].join(' ')}
                >
                  {pedido.tipo === 'LOCAL' ? (
                    <MapPin className="h-3 w-3" strokeWidth={1} />
                  ) : (
                    <Package className="h-3 w-3" strokeWidth={1} />
                  )}
                  {pedido.tipo}
                </span>
                <span className="font-sans text-sm font-semibold leading-[1.2] tracking-tight text-zinc-900">{pedido.codigo}</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 ring-1 ring-zinc-950/[0.04]">
                <Clock className="mr-2 h-3 w-3" strokeWidth={1} />
                {formatTime(pedido.criadoEm)}
              </div>
            </div>

            <div className="mb-8 space-y-4">
              {pedido.itens.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between gap-8 text-sm leading-[1.2]">
                  <span className="mr-4 min-w-0 truncate text-zinc-600">
                    <span className="mr-2 font-mono tabular-nums tracking-tighter text-zinc-400">{item.quantidade}×</span> {item.nomeSnapshot}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-medium tabular-nums tracking-tighter text-zinc-950">{formatMoney(item.precoSnapshot * item.quantidade)}</span>
                </div>
              ))}
              {pedido.itens.length > 3 && (
                <div className="text-[13px] font-medium text-zinc-500">
                  + {pedido.itens.length - 3} outros itens...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-8 border-t border-zinc-950/[0.06] pt-8">
               <div>
                  <p className="mb-2 text-[13px] font-medium leading-[1.2] text-zinc-500">Total parcial</p>
                  <p className="font-mono text-lg font-semibold tabular-nums tracking-tighter leading-[1.2] text-zinc-950">{formatMoney(pedido.totalBruto)}</p>
               </div>
               
               <Button 
                  size="sm" 
                  className="h-11 bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] px-6 font-semibold leading-[1.2] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,74,7,0.3)] active:scale-[0.97] disabled:opacity-60"
                  onClick={(e) => handleConfirmOrder(pedido.id, e)}
                  disabled={confirmingId === pedido.id}
               >
                 {confirmingId === pedido.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span> : (
                   <>Enviar <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} /></>
                 )}
               </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-20 px-8 sm:px-12">
        <Button 
          className="pointer-events-auto h-14 w-full rounded-2xl bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] font-sans text-base font-semibold uppercase leading-[1.2] tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,74,7,0.3)] active:scale-[0.97]"
          onClick={() => {
            setEditingPedido(null)
            setModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-6 w-6" strokeWidth={1.5} /> Novo Pedido
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
    </>
  )
}
