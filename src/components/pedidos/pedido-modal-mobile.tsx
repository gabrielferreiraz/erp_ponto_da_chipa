'use client'

import { useState } from 'react'
import { Plus, Search, Minus, ShoppingBag, Package, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProdutos } from '@/hooks/use-produtos'
import { usePedidosAtendente } from '@/hooks/use-pedidos-atendente'
import { toast } from 'sonner'
import { PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { useMediaQuery } from '@/hooks/use-media-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PedidoModalMobileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoEdicao?: PedidoFrontend | null
}

interface CartItem {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
  qtdVisor: number
  imagemUrl?: string | null
}

export function PedidoModalMobile({ open, onOpenChange, pedidoEdicao }: PedidoModalMobileProps) {
  const { produtos } = useProdutos({ status: 'disponivel' })
  const { mutate } = usePedidosAtendente()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const [tipo, setTipo] = useState<'LOCAL' | 'VIAGEM'>(pedidoEdicao?.tipo || 'LOCAL')
  const [observacao, setObservacao] = useState(pedidoEdicao?.observacao || '')
  
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<CartItem[]>(
    pedidoEdicao ? pedidoEdicao.itens.map(i => ({
      produtoId: i.produtoId,
      nome: i.nomeSnapshot,
      preco: i.precoSnapshot,
      quantidade: i.quantidade,
      qtdVisor: 999,
    })) : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const totalCarrinho = carrinho.reduce((acc, curr) => acc + (curr.preco * curr.quantidade), 0)

  const handleAddToCart = (p: typeof produtos[0]) => {
    if (p.qtdVisor <= 0) return

    setCarrinho(prev => {
      const exists = prev.find(item => item.produtoId === p.id)
      if (exists) {
        if (exists.quantidade >= p.qtdVisor) {
          toast.error('Limite máximo do visor atingido para este item.')
          return prev
        }
        return prev.map(item => item.produtoId === p.id ? { ...item, quantidade: item.quantidade + 1 } : item)
      }
      return [...prev, { 
        produtoId: p.id, 
        nome: p.nome, 
        preco: p.preco, 
        quantidade: 1, 
        qtdVisor: p.qtdVisor,
        imagemUrl: p.imagemUrl
      }]
    })
  }

  const handleDecreaseFromCart = (produtoId: string) => {
    setCarrinho(prev => {
      const exists = prev.find(item => item.produtoId === produtoId)
      if (exists && exists.quantidade > 1) {
        return prev.map(item => item.produtoId === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item)
      }
      return prev.filter(item => item.produtoId !== produtoId)
    })
  }

  const handleSavePedido = async () => {
    if (carrinho.length === 0) {
      toast.error('O pedido precisa ter pelo menos um item.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        tipo,
        observacao: observacao.trim() || null,
        mesaId: null,
        itens: carrinho.map(c => ({ produtoId: c.produtoId, quantidade: c.quantidade }))
      }

      const url = pedidoEdicao ? `/api/pedidos/${pedidoEdicao.id}` : '/api/pedidos'
      const method = pedidoEdicao ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar pedido')
      }

      toast.success(pedidoEdicao ? 'Pedido atualizado!' : 'Pedido criado com sucesso!')
      mutate()
      onOpenChange(false)
      
      if (!pedidoEdicao) {
         setCarrinho([])
         setTipo('LOCAL')
         setObservacao('')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Conteúdo Compartilhado entre Dialog e Drawer
  const InnerContent = () => (
    <>
      <style jsx global>{`
        ::selection {
          background: #ffe4cc;
          color: #9a3412;
        }
        .grain-overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0.2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 140% 0%; }
        }
        .shimmer {
          background-image: linear-gradient(90deg, rgba(231, 233, 237, 0.2) 0%, rgba(231, 233, 237, 0.9) 35%, rgba(231, 233, 237, 0.2) 70%);
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        .hitbox-48::after {
          content: '';
          position: absolute;
          inset: -12px;
          border-radius: 999px;
        }
      `}</style>
      
      <div className="grain-overlay" />

      {/* Header Fixo */}
      <div className="px-6 py-5 border-b border-zinc-950/[0.04] bg-white shrink-0 relative z-10 space-y-5 rounded-t-[10px] md:rounded-t-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-zinc-900">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 border border-red-100">
              <ShoppingBag className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{pedidoEdicao ? 'Editar Pedido' : 'Novo Pedido'}</h2>
          </div>
          
          <button 
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control de Consumo Animado (Framer Motion) */}
        <div className="relative flex p-1 bg-zinc-100 rounded-2xl w-full border border-zinc-950/[0.04]">
          {['LOCAL', 'VIAGEM'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTipo(option as 'LOCAL' | 'VIAGEM')}
              className={cn(
                "relative z-10 w-1/2 py-2.5 text-[13px] font-semibold tracking-tight rounded-xl transition-colors duration-200",
                tipo === option ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {option === 'LOCAL' ? 'Consumo Local' : 'Viagem'}
              {tipo === option && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] border border-zinc-950/[0.03]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  style={{ zIndex: -1 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
          <Input 
            placeholder="Buscar chipa, bebida..." 
            className="h-11 rounded-2xl border-none shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] bg-white pl-10 text-[13px] font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500/30" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-8 pb-32 bg-[#FAFAFA]">
        {produtos.length === 0 ? (
           <div className="space-y-4">
             {Array.from({ length: 4 }).map((_, idx) => (
               <div key={idx} className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.03]">
                 <div className="flex gap-4">
                   <div className="h-20 w-20 rounded-[14px] shimmer" />
                   <div className="flex-1 space-y-3 py-2">
                     <div className="h-4 w-3/4 rounded-full shimmer" />
                     <div className="h-3 w-1/2 rounded-full shimmer" />
                   </div>
                 </div>
               </div>
             ))}
           </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="rounded-[24px] bg-white px-8 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04]">
            <Package className="mx-auto mb-4 h-10 w-10 text-zinc-300" strokeWidth={1.5} />
            <p className="text-[13px] font-medium leading-[1.2] tracking-tight text-zinc-500">
              Nenhum produto encontrado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {produtosFiltrados.map((prod) => {
              const carrinhoItem = carrinho.find(c => c.produtoId === prod.id)
              const semEstoque = prod.qtdVisor <= 0

              return (
                <div 
                  key={prod.id} 
                  className={cn(
                    "flex gap-4 rounded-[20px] p-4 ring-1 transition-all duration-300 active:scale-[0.98]",
                    semEstoque
                      ? 'bg-zinc-100 ring-zinc-950/[0.03] opacity-60'
                      : 'bg-white ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]'
                  )}
                >
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-[14px] bg-zinc-100/50 ring-1 ring-zinc-950/[0.04]">
                    {prod.imagemUrl ? (
                      <img src={prod.imagemUrl} alt={prod.nome} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300">
                        <Package className="h-8 w-8" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-[14px] font-semibold leading-[1.2] tracking-tight text-zinc-900">{prod.nome}</h4>
                        {semEstoque && (
                          <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-700 ring-1 ring-rose-100">
                            Falta
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[13px] mt-1 font-medium tabular-nums tracking-tighter text-zinc-500">{formatMoney(prod.preco)}</p>
                    </div>

                    {!semEstoque ? (
                      <div className="mt-3 flex items-center justify-end gap-3">
                        {carrinhoItem && carrinhoItem.quantidade > 0 ? (
                          <>
                            <button 
                              type="button"
                              className="relative flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 active:bg-zinc-300 hitbox-48"
                              onClick={() => handleDecreaseFromCart(prod.id)}
                            >
                              <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                            <span className="min-w-[1.5rem] text-center font-mono text-[15px] font-bold tabular-nums tracking-tighter text-zinc-900">
                              {carrinhoItem.quantidade}
                            </span>
                            <button 
                              type="button"
                              className="relative flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200 active:bg-orange-300 hitbox-48"
                              onClick={() => handleAddToCart(prod)}
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </>
                        ) : (
                          <button 
                            type="button"
                            className="relative flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-zinc-900 text-[11px] font-semibold text-white transition-all active:scale-[0.95] hitbox-48 hover:bg-zinc-800"
                            onClick={() => handleAddToCart(prod)}
                          >
                            <Plus className="h-3 w-3" strokeWidth={2} /> ADD
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex justify-end">
                        <span className="text-[11px] font-medium text-zinc-400">Indisponível</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Observações */}
        <div className="mt-8 space-y-3">
          <label className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500">Observações adicionais</label>
          <Textarea 
            placeholder="Ex: Assar bem, separados..." 
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className="min-h-[80px] resize-none rounded-xl border-none shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] bg-white text-[13px] ring-1 ring-zinc-950/[0.04] transition-all focus-visible:ring-2 focus-visible:ring-orange-500/30"
          />
        </div>
      </div>

      {/* Footer Carrinho Fixo */}
      {carrinho.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-zinc-950/[0.04] shadow-[0_-12px_24px_-8px_rgba(0,0,0,0.06)] z-20 md:rounded-b-[24px]">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Total do Pedido</p>
              <p className="font-mono text-[24px] font-black tabular-nums tracking-tighter text-zinc-900">
                {formatMoney(totalCarrinho)}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-orange-50 ring-1 ring-orange-500/10">
              <span className="text-[12px] font-bold text-orange-600">{carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>

          <button 
            type="button"
            className="w-full h-[56px] rounded-2xl bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] flex items-center justify-center text-[15px] font-black uppercase tracking-widest text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(226,74,7,0.35),0_2px_8px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 sm:mt-6"
            onClick={handleSavePedido}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'SALVANDO...' : (pedidoEdicao ? 'SALVAR EDIÇÃO' : 'ENVIAR PEDIDO')}
          </button>
        </div>
      )}
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl w-full h-[85vh] p-0 flex flex-col overflow-hidden border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] sm:rounded-[24px]">
          <InnerContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col h-[94vh] rounded-t-[20px] bg-white overflow-hidden shadow-[0_-24px_48px_-12px_rgba(0,0,0,0.15)] focus:outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-4 mb-2" />
          <InnerContent />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

