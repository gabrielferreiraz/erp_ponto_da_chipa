'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Clock, Banknote, XCircle, UserCircle, Hash, Loader2, Wifi, WifiOff } from 'lucide-react'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { useFilaCaixa, FilaPedidoFrontend, FilaItemFrontend } from '@/hooks/use-fila-caixa'
import { ptBR } from 'date-fns/locale'
import { ModalCancelamento } from '@/components/caixa/modal-cancelamento'
import { ModalPagamento } from '@/components/caixa/modal-pagamento'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function FilaCaixaPage() {
  const { fila, isLoading, error } = useFilaCaixa()
  
  const [pagarPedido, setPagarPedido] = useState<FilaPedidoFrontend | null>(null)
  const [cancelarItem, setCancelarItem] = useState<FilaItemFrontend | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  const formatCompactTime = (date: Date | string) => {
    const diff = differenceInMinutes(new Date(), new Date(date))
    if (diff < 1) return 'Agora'
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}h`
  }

  const getUrgenciaColor = (date: Date | string) => {
    const min = differenceInMinutes(new Date(), new Date(date))
    if (min < 5) return 'border-emerald-500/40'
    if (min < 15) return 'border-orange-500/40'
    return 'border-rose-500/40'
  }

  const handleFaturar = (pedido: FilaPedidoFrontend) => {
    setIsProcessing(pedido.id)
    setPagarPedido(pedido)
    // O modal cuidará do fechamento e reset do estado de processamento via onClose
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      {/* Header Minimalista (A11y: Banner) */}
      <header role="banner" className="h-20 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-[11px] font-black tracking-[0.25em] text-zinc-400 uppercase leading-none">Terminal de Operação</h1>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight mt-1">Fila de Pedidos</h2>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200/50 shadow-sm ring-1 ring-black/[0.02]">
            {error ? (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Desconectado</span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sincronizado</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-4 border border-zinc-200/60 shadow-sm ring-1 ring-black/[0.01]">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Aguardando</span>
              <span className="font-mono text-sm font-black text-zinc-900 tabular-nums leading-none mt-0.5">{fila.length}</span>
            </div>
            <div className="w-px h-6 bg-zinc-100" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hoje</span>
              <span className="font-mono text-sm font-black text-zinc-900 tabular-nums leading-none mt-0.5">--</span>
            </div>
          </div>
        </div>
      </header>

      {/* Grid de Pedidos (A11y: Main Content) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 lg:p-10 scrollbar-none">
        <section 
          aria-label="Fila de pedidos ativos" 
          aria-live="polite"
          className="flex gap-6 h-full items-start pb-4"
        >
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // Skeleton Loading Compacto
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[300px] h-[480px] bg-white rounded-[24px] border border-zinc-200/60 animate-pulse shrink-0 shadow-sm" />
              ))
            ) : fila.length === 0 ? (
              // Empty State Clean
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full h-full flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-white border border-zinc-200/60 shadow-sm flex items-center justify-center ring-1 ring-black/[0.02]">
                  <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-zinc-900 tracking-tight">Fluxo de Pedidos Vazio</p>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest mt-1">Aguardando novos fluxos...</p>
                </div>
              </motion.div>
            ) : (
              fila.map((pedido) => {
                const totalAtivo = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)
                const isLocal = pedido.tipo === 'LOCAL'
                
                return (
                  <article
                    key={pedido.id}
                    id={`pedido-${pedido.id}`}
                    className="shrink-0 w-[300px] h-full max-h-[600px]"
                  >
                    <Card className={cn(
                      "group flex flex-col h-full bg-white rounded-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 relative ring-1 ring-zinc-950/[0.03] border-none",
                      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:transition-colors",
                      getUrgenciaColor(pedido.criadoEm).replace('border', 'before:bg')
                    )}>
                      
                      <CardHeader className="p-6 pb-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200/50">
                            <Hash className="w-2.5 h-2.5 text-zinc-400" strokeWidth={3} />
                            <span className="font-mono text-[10px] font-bold text-zinc-500 tracking-tighter tabular-nums uppercase">{pedido.codigo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-50/50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            <span className="text-[10px] font-black tabular-nums uppercase tracking-tight">
                              {formatCompactTime(pedido.criadoEm)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="font-sans text-lg font-bold tracking-tight text-zinc-900 leading-tight">
                            {isLocal && pedido.mesa?.numero ? (
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-900" />
                                Mesa {pedido.mesa.numero}
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 italic text-zinc-500 font-medium">
                                Balcão / Viagem
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-zinc-400">
                            <UserCircle className="w-3 h-3" strokeWidth={2} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">{pedido.atendente.nome.split(' ')[0]}</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 px-6 py-0 overflow-y-auto scrollbar-none">
                        <ul className="space-y-3 border-t border-zinc-100 pt-5">
                          {pedido.itens.map((item) => (
                            <li key={item.id} className="group/item flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="font-mono text-[11px] font-black text-zinc-300 tabular-nums mt-0.5 shrink-0">
                                  {item.quantidade}x
                                </span>
                                <span className="text-[13px] font-medium text-zinc-600 leading-snug tracking-tight">
                                  {item.nomeSnapshot}
                                </span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setCancelarItem(item)}
                                aria-label={`Remover ${item.nomeSnapshot}`}
                                className="opacity-0 group-hover/item:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-zinc-300 hover:text-rose-500 transition-all active:scale-90"
                              >
                                <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter className="p-6 pt-4 flex flex-col gap-4 bg-zinc-50/40 border-t border-zinc-100/60">
                        <div className="flex items-end justify-between w-full">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total Líquido</span>
                            <span className="font-mono text-2xl font-black text-zinc-900 tracking-tighter tabular-nums leading-none mt-1">
                              {formatMoney(totalAtivo)}
                            </span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => handleFaturar(pedido)}
                          disabled={pedido.itens.length === 0 || isProcessing === pedido.id}
                          className={cn(
                            "group/btn relative w-full h-12 rounded-2xl bg-zinc-950 text-white font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2",
                            "hover:bg-gradient-to-br hover:from-zinc-800 hover:to-zinc-950 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-950"
                          )}
                        >
                          {isProcessing === pedido.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Banknote className="w-4 h-4 transition-transform group-hover/btn:scale-110" strokeWidth={1.5} />
                              <span>Faturar</span>
                            </>
                          )}
                        </button>
                      </CardFooter>
                    </Card>
                  </article>
                )
              })
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Modais com reset de estado */}
      <ModalCancelamento 
        item={cancelarItem} 
        onClose={() => setCancelarItem(null)} 
      />
      <ModalPagamento 
        pedido={pagarPedido} 
        onClose={() => {
          setPagarPedido(null)
          setIsProcessing(null)
        }} 
      />
    </div>
  )
}
