'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Banknote, XCircle, UserCircle, Package, MapPin, LogOut } from 'lucide-react'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { logoutAction } from '@/actions/auth'
import { useFilaCaixa, FilaPedidoFrontend, FilaItemFrontend } from '@/hooks/use-fila-caixa'
import { ptBR } from 'date-fns/locale'
import { ModalCancelamento } from '@/components/caixa/modal-cancelamento'
import { ModalPagamento } from '@/components/caixa/modal-pagamento'

export default function FilaCaixaPage() {
  const { fila, isLoading, isError } = useFilaCaixa()
  
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)
  const [cancelarItem, setCancelarItem] = useState<FilaItemFrontend | null>(null)

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const formatTime = (date: Date | string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })

  const getTempoBadgeCor = (date: Date | string) => {
    const min = differenceInMinutes(new Date(), new Date(date))
    if (min < 10) return 'bg-green-100 text-green-700 border-green-200/80'
    if (min <= 20) return 'bg-amber-100 text-amber-800 border-amber-200/80'
    return 'bg-rose-100 text-rose-800 border-rose-200/80 animate-pulse'
  }

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

      <div className="relative mx-auto min-h-screen max-w-[1600px] bg-[#FAFAFA] p-8 lg:p-12 selection:bg-orange-100 selection:text-orange-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [background-position:center] opacity-[0.25]"
        />
        <div className="relative z-10">
      <div className="mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-sans text-3xl font-semibold leading-[1.2] tracking-tight text-zinc-900 lg:text-4xl">Fila do Caixa</h1>
          <p className="mt-3 text-[13px] font-medium leading-[1.2] text-zinc-500">
            Pedidos aguardando faturamento (Tempo real via SSE)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center justify-center gap-4 rounded-2xl border border-zinc-950/[0.06] bg-white px-8 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04]">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold leading-[1.2] tracking-tight text-zinc-800">
                <span className="font-mono tabular-nums tracking-tighter">{fila.length}</span> pedidos ativos
              </span>
          </div>

          <Button 
            variant="outline" 
            onClick={() => logoutAction()}
            className="flex h-12 items-center gap-4 rounded-2xl border border-zinc-950/[0.06] px-8 font-semibold leading-[1.2] text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-50 hover:text-[#B91C1C] hover:brightness-110 active:scale-[0.97]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Sair do Sistema</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="pt-20">
          <div className="mb-8 h-6 w-1/3 rounded-2xl shimmer" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-950/[0.06] bg-white p-8 ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="h-5 w-20 rounded-full shimmer" />
                  <div className="h-6 w-28 rounded-full shimmer" />
                </div>
                <div className="mt-8 space-y-4">
                  <div className="h-4 w-2/3 rounded-2xl shimmer" />
                  <div className="h-4 w-1/2 rounded-2xl shimmer" />
                  <div className="h-4 w-3/4 rounded-2xl shimmer" />
                </div>
                <div className="mt-8 h-14 w-full rounded-2xl shimmer" />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-[13px] font-medium leading-[1.2] tracking-tight text-zinc-500">
            Sincronizando fila...
          </div>
        </div>
      )}

      {!isLoading && fila.length === 0 && (
         <div className="rounded-2xl border border-dashed border-zinc-950/[0.06] bg-white px-8 py-28 text-center text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] sm:px-12">
           <Banknote className="mx-auto mb-6 h-16 w-16 text-zinc-200" strokeWidth={1} />
           <p className="font-sans text-lg font-semibold leading-[1.2] tracking-tight text-zinc-600">Nenhum pedido aguardando cobrança.</p>
           <p className="mt-1 text-[13px] font-medium text-zinc-500">O salão está vazio ou fluido no momento.</p>
         </div>
      )}

      {/* Grid Desktop Responsive: 1 coluna no celular, 2 tablet, 3 PC, 4 Ultra wide */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {fila.map(pedido => {
          const totalAtivo = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)

          return (
            <Card key={pedido.id} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-950/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.05)]">
              
              <CardHeader className="border-b border-zinc-950/[0.06] bg-white px-8 pb-6 pt-8 sm:px-10 sm:pt-10">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex min-w-0 flex-col gap-6">
                    <span
                      className={[
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest',
                        'ring-1 ring-zinc-950/[0.04]',
                        pedido.tipo === 'LOCAL'
                          ? 'bg-[#B91C1C]/10 text-[#B91C1C]'
                          : 'bg-zinc-50 text-zinc-700',
                      ].join(' ')}
                    >
                      {pedido.tipo === 'LOCAL' ? (
                        <MapPin className="h-3 w-3" strokeWidth={1} />
                      ) : (
                        <Package className="h-3 w-3" strokeWidth={1} />
                      )}
                      {pedido.tipo}{' '}
                      {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : ''}
                    </span>
                    <CardTitle className="font-sans text-xl font-semibold leading-[1.2] tracking-tight text-zinc-900">{pedido.codigo}</CardTitle>
                  </div>
                  
                  <span
                    className={[
                      'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest',
                      'ring-1 ring-zinc-950/[0.04] tabular-nums tracking-tighter',
                      getTempoBadgeCor(pedido.criadoEm),
                    ].join(' ')}
                  >
                    <Clock className="h-3 w-3" strokeWidth={1} />
                    {formatTime(pedido.criadoEm)}
                  </span>
                </div>
                {pedido.atendente && (
                  <div className="mt-4 flex w-fit items-center gap-4 rounded-full bg-zinc-50 px-4 py-2 text-[13px] font-medium leading-[1.2] text-zinc-600 ring-1 ring-zinc-950/[0.04]">
                     <UserCircle className="h-4 w-4 text-zinc-500" strokeWidth={1.5} /> Atendente: {pedido.atendente.nome.split(' ')[0]}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 bg-[#FAFAFA]/40 p-0">
                <div>
                  {pedido.itens.length === 0 ? (
                    <div className="p-8 sm:px-10">
                      <p className="text-[13px] font-medium italic leading-[1.2] text-zinc-500">Todos os itens cancelados.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-8 border-b border-zinc-950/[0.06] px-8 py-3 text-[13px] font-medium leading-[1.2] text-zinc-500 sm:px-10">
                        <span>Item</span>
                        <span className="text-right tabular-nums">Qtd</span>
                        <span className="text-right">Subtotal</span>
                      </div>
                      {pedido.itens.map(item => (
                        <div
                          key={item.id}
                          className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-8 border-b border-zinc-950/[0.06] bg-white/80 px-8 py-3 text-sm leading-[1.2] transition-all duration-200 ease-in-out last:border-b-0 hover:bg-white sm:px-10"
                        >
                          <div className="min-w-0 truncate pr-2">
                            <span className="mr-2 inline-flex rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums tracking-tighter text-zinc-700 ring-1 ring-zinc-950/[0.04]">
                              {item.quantidade}×
                            </span>
                            <span className="font-medium text-zinc-800">{item.nomeSnapshot}</span>
                          </div>
                          <span className="text-right font-mono text-xs tabular-nums tracking-tighter text-zinc-500">{item.quantidade}</span>
                          <div className="flex items-center justify-end gap-4">
                            <span className="font-mono text-sm font-semibold tabular-nums tracking-tighter text-zinc-950">
                              {formatMoney(item.precoSnapshot * item.quantidade)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl text-zinc-400 opacity-0 transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-100 hover:text-[#B91C1C] hover:brightness-110 active:scale-[0.97] group-hover:opacity-100"
                              onClick={() => setCancelarItem(item)}
                              title="Cancelar Item"
                            >
                              <XCircle className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                
                {pedido.observacao && (
                  <div className="mx-8 mb-8 mt-6 rounded-2xl border border-amber-200/50 bg-amber-50/90 p-6 text-[13px] font-medium leading-[1.2] text-amber-900 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] sm:mx-10">
                    <span className="mb-2 block text-[13px] font-medium text-zinc-500">Observação</span>
                    {pedido.observacao}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col items-stretch justify-between gap-8 border-t border-zinc-950/[0.06] bg-white p-8 sm:flex-row sm:items-center sm:px-10 sm:py-8">
                <div>
                   <p className="mb-2 text-[13px] font-medium leading-[1.2] text-zinc-500">Total a cobrar</p>
                   <p className="font-mono text-4xl font-semibold tabular-nums tracking-tighter leading-[1.1] text-zinc-950 drop-shadow-[0_8px_18px_rgba(0,0,0,0.10)]">{formatMoney(totalAtivo)}</p>
                </div>

                <Button 
                   size="lg" 
                   className="h-14 shrink-0 rounded-2xl bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] px-8 font-semibold leading-[1.2] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,74,7,0.3)] active:scale-[0.97] disabled:opacity-50"
                   onClick={() => setPagarPedido(pedido)}
                   disabled={pedido.itens.length === 0}
                >
                  <Banknote className="-ml-1 mr-2 h-5 w-5" strokeWidth={1.5} /> Cobrar
                </Button>
              </CardFooter>

            </Card>
          )
        })}
      </div>

      <ModalCancelamento item={cancelarItem} onClose={() => setCancelarItem(null)} />
      <ModalPagamento pedido={pagarPedido} onClose={() => setPagarPedido(null)} />
    </div>
  </div>
    </>
  )
}
