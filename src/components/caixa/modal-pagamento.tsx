'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { useProdutos } from '@/hooks/use-produtos'
import { CheckCircle2, Banknote, CreditCard, ScanLine, Smartphone, Minus, Plus, Trash2, Search, Package, ShoppingBag, X, Loader2 } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface ModalPagamentoProps {
  pedido: FilaPedidoFrontend | null
  onClose: () => void
}

type FormaPagto = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'

export function ModalPagamento({ pedido: stalePedido, onClose }: ModalPagamentoProps) {
  const [forma, setForma] = useState<FormaPagto>('DINHEIRO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isProcessingItem, setIsProcessingItem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  const { fila, mutate } = useFilaCaixa()
  const { produtos } = useProdutos()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // O Reactivo Live Pedido (SWR Data Pattern)
  const pedido = fila.find(p => p.id === stalePedido?.id) || stalePedido

  const filteredProdutos = useMemo(() => {
    if (!searchTerm) return []
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && p.disponivel
    ).slice(0, 5)
  }, [produtos, searchTerm])

  const handlePagar = async () => {
    if (!pedido) return
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/caixa/${pedido.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formaPagamento: forma, idempotencyKey: crypto.randomUUID() })
      })

      if (!res.ok) throw new Error('Erro ao faturar pedido')

      setShowSuccess(true)
      await mutate()
      setTimeout(() => { setShowSuccess(false); onClose(); }, 1000)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateItem = async (produtoId: string, acao: 'ADICIONAR' | 'REMOVER') => {
    if (!pedido) return
    try {
      setIsProcessingItem(produtoId)
      const endpoint = acao === 'ADICIONAR' 
        ? `/api/caixa/${pedido.id}/adicionar-item` 
        : `/api/caixa/${pedido.id}/cancelar-item`

      const res = await fetch(endpoint, {
        method: acao === 'ADICIONAR' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acao === 'ADICIONAR' ? { produtoId, quantidade: 1 } : { produtoId, quantidadeCancelada: 1 })
      })

      if (!res.ok) throw new Error('Erro ao atualizar item')
      await mutate()
      setSearchTerm('')
      setShowSearch(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessingItem(null)
    }
  }

  if (!pedido) return null
  
  const total = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)

  const InnerContent = () => (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Faturar {pedido.codigo}</h2>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Checkout do Sistema</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl shadow-sm">
            <span className="font-mono text-xl font-black tabular-nums tracking-tighter text-emerald-600">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-none bg-zinc-50/30">
        {/* Adicionar Itens Rápidos */}
        <div className="relative">
          {!showSearch ? (
            <button 
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-white hover:border-orange-400 hover:bg-orange-50/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-zinc-400 group-hover:text-orange-500" />
                <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-600">ADICIONAR ITEM EXTRA</span>
              </div>
              <Search className="w-4 h-4 text-zinc-300" />
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  autoFocus
                  className="w-full h-12 pl-11 pr-10 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Pesquisar produto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={() => setShowSearch(false)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-lg">
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              
              {filteredProdutos.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-zinc-50">
                  {filteredProdutos.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleUpdateItem(p.id, 'ADICIONAR')}
                      className="w-full p-4 flex items-center justify-between hover:bg-orange-50 transition-colors group"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-zinc-800">{p.nome}</span>
                        <span className="text-[11px] font-mono font-bold text-zinc-400">{formatMoney(Number(p.preco))}</span>
                      </div>
                      <Plus className="w-4 h-4 text-zinc-300 group-hover:text-orange-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Itens do Pedido */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <ShoppingBag className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Resumo do Pedido</span>
          </div>
          {pedido.itens.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm group">
              <div className="flex flex-col min-w-0 pr-4">
                <span className="font-bold text-zinc-900 text-sm truncate leading-tight">{item.nomeSnapshot}</span>
                <span className="text-zinc-400 font-mono text-xs tabular-nums font-bold mt-0.5">{formatMoney(Number(item.precoSnapshot))}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-xl p-1 shrink-0">
                <button 
                  onClick={() => handleUpdateItem(item.id, 'REMOVER')}
                  disabled={isProcessingItem === item.id || isSubmitting}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50 active:scale-90"
                >
                  {isProcessingItem === item.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : (
                    item.quantidade === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />
                  )}
                </button>
                <span className="font-mono text-sm font-black text-zinc-900 tabular-nums w-6 text-center">
                  {item.quantidade}
                </span>
                <button 
                  onClick={() => handleUpdateItem(item.id, 'ADICIONAR')}
                  disabled={isProcessingItem === item.id || isSubmitting}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-50 text-zinc-400 hover:text-orange-500 transition-colors disabled:opacity-50 active:scale-90"
                >
                  {isProcessingItem === item.id ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Meios de Pagamento */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Banknote className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Meio de Pagamento</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'DINHEIRO', icon: Banknote, label: 'DINHEIRO', color: 'zinc' },
              { id: 'PIX', icon: ScanLine, label: 'PIX', color: 'teal' },
              { id: 'CARTAO_DEBITO', icon: CreditCard, label: 'DÉBITO', color: 'zinc' },
              { id: 'CARTAO_CREDITO', icon: Smartphone, label: 'CRÉDITO', color: 'zinc' }
            ].map(p => (
              <button 
                key={p.id}
                disabled={isSubmitting || showSuccess || pedido.itens.length === 0}
                onClick={() => setForma(p.id as FormaPagto)}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 font-bold transition-all active:scale-95",
                  forma === p.id 
                    ? p.color === 'teal' 
                      ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20" 
                      : "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20"
                    : p.color === 'teal'
                      ? "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100"
                      : "bg-white text-zinc-500 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200"
                )}
              >
                <p.icon className="w-5 h-5" strokeWidth={forma === p.id ? 2.5 : 2} />
                <span className="text-[10px] tracking-widest">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 bg-white border-t border-zinc-100 space-y-3">
         <button 
           onClick={handlePagar} 
           disabled={isSubmitting || showSuccess || pedido.itens.length === 0} 
           className={cn(
             "h-16 w-full font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center",
             showSuccess 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "bg-gradient-to-br from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(226,74,7,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-95"
           )}
         >
           {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : showSuccess ? (
             <div className="flex items-center gap-3 animate-in zoom-in-95 duration-300">
               <CheckCircle2 className="w-6 h-6" /> RECEBIDO!
             </div>
           ) : (
             "CONFIRMAR RECEBIMENTO"
           )}
         </button>
         <button onClick={onClose} disabled={isSubmitting || showSuccess} className="w-full h-12 text-[11px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors">
           CANCELAR
         </button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={!!pedido} onOpenChange={(open) => { if (!isSubmitting) onClose() }}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] sm:rounded-[32px] overflow-hidden focus:outline-none">
          <InnerContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root open={!!pedido} onOpenChange={(open) => { if (!open && !isSubmitting && !showSuccess) onClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[32px] bg-white shadow-[0_-24px_48px_-12px_rgba(0,0,0,0.2)] focus:outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-200 mt-4 mb-2" />
          <InnerContent />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
