'use client'

import { useState } from 'react'
import { Plus, Search, Minus, ShoppingBag, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProdutos } from '@/hooks/use-produtos'
import { usePedidosAtendente } from '@/hooks/use-pedidos-atendente'
import { toast } from 'sonner'
import { PedidoFrontend } from '@/hooks/use-pedidos-atendente'

interface PedidoModalMobileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoEdicao?: PedidoFrontend | null // Se for null cria novo, se existir edita.
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
  const { produtos } = useProdutos({ status: 'disponivel' }) // Carrega só ativados
  const { mutate } = usePedidosAtendente()

  const [tipo, setTipo] = useState<'LOCAL' | 'VIAGEM'>(pedidoEdicao?.tipo || 'LOCAL')
  const [observacao, setObservacao] = useState(pedidoEdicao?.observacao || '')
  // Mesa será implementada depois em modulo proprio, deixamos null
  
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<CartItem[]>(
    pedidoEdicao ? pedidoEdicao.itens.map(i => ({
      produtoId: i.produtoId,
      nome: i.nomeSnapshot,
      preco: i.precoSnapshot,
      quantidade: i.quantidade,
      qtdVisor: 999, // Na edição assumimos liberado ou refatch do visor atual
    })) : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtra produtos na exibição
  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const totalCarrinho = carrinho.reduce((acc, curr) => acc + (curr.preco * curr.quantidade), 0)

  const handleAddToCart = (p: typeof produtos[0]) => {
    if (p.qtdVisor <= 0) return // Prevenção de clique no front

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
      mutate() // Refatch na lista principal
      onOpenChange(false)
      
      // Limpa dados apos sucesso se foi criação
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full h-[90vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
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

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [background-position:center] opacity-[0.12]"
        />
        
        {/* Header Fixo */}
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <ShoppingBag className="w-5 h-5 text-red-600" />
            {pedidoEdicao ? 'Editar Pedido' : 'Novo Pedido'}
          </DialogTitle>

          <div className="flex gap-8">
            <Button 
              type="button" 
              variant={tipo === 'LOCAL' ? 'default' : 'outline'} 
              className={`flex-1 rounded-2xl leading-[1.2] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 active:scale-[0.97] ${
                tipo === 'LOCAL'
                  ? 'bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] hover:shadow-[0_0_20px_rgba(226,74,7,0.3)]'
                  : 'ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] hover:bg-zinc-50'
              }`}
              onClick={() => setTipo('LOCAL')}
            >
              Consumo Local
            </Button>
            <Button 
              type="button" 
              variant={tipo === 'VIAGEM' ? 'default' : 'outline'} 
              className={`flex-1 rounded-2xl leading-[1.2] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 active:scale-[0.97] ${
                tipo === 'VIAGEM'
                  ? 'bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] hover:shadow-[0_0_20px_rgba(226,74,7,0.3)]'
                  : 'ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] hover:bg-zinc-50'
              }`}
              onClick={() => setTipo('VIAGEM')}
            >
              Viagem
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
            <Input 
              placeholder="Buscar chinela, chipa..." 
              className="h-12 rounded-2xl border border-zinc-950/[0.06] bg-white pl-11 text-sm leading-[1.2] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out focus-visible:border-orange-500/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-500/20" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </DialogHeader>

        {/* Corpo com Grid de Produtos */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 pb-44 sm:p-12 sm:pb-48">
          {produtos.length === 0 ? (
             <div className="pt-10">
               <div className="mb-8 h-6 w-2/3 rounded-2xl shimmer" />
               <div className="space-y-6">
                 {Array.from({ length: 4 }).map((_, idx) => (
                   <div
                     key={idx}
                     className="rounded-2xl border border-zinc-950/[0.06] bg-white p-8 ring-1 ring-zinc-950/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)]"
                   >
                     <div className="flex gap-8">
                       <div className="h-16 w-16 rounded-2xl shimmer" />
                       <div className="flex-1 space-y-4">
                         <div className="h-4 w-3/4 rounded-2xl shimmer" />
                         <div className="h-4 w-2/3 rounded-2xl shimmer" />
                         <div className="mt-8 h-10 w-full rounded-2xl shimmer" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="mt-8 text-center text-[13px] font-medium leading-[1.2] tracking-tight text-zinc-500">
                 Carregando cardápio...
               </div>
             </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-zinc-950/[0.06] bg-white px-8 py-16 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04]">
              <Package className="mx-auto mb-6 h-12 w-12 text-zinc-200" strokeWidth={1} />
              <p className="text-[13px] font-medium leading-[1.2] tracking-tight text-zinc-500">
                Nenhum produto encontrado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {produtosFiltrados.map((prod) => {
                const carrinhoItem = carrinho.find(c => c.produtoId === prod.id)
                const semEstoque = prod.qtdVisor <= 0

                return (
                  <div 
                    key={prod.id} 
                    className={`flex gap-8 rounded-2xl border p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out ${
                      semEstoque
                        ? 'border-zinc-950/[0.06] bg-zinc-50/80 opacity-60'
                        : 'border-zinc-950/[0.06] bg-white hover:translate-y-[-2px] hover:bg-zinc-50/80 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_24px_-6px_rgba(0,0,0,0.04)] active:scale-[0.97]'
                    }`}
                  >
                    <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-950/[0.06] bg-zinc-100 ring-1 ring-zinc-950/[0.04]">
                      {prod.imagemUrl ? (
                        <img
                          src={prod.imagemUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <Package className="h-8 w-8" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-4">
                          <h4 className="truncate font-medium leading-[1.2] tracking-tight text-zinc-900">{prod.nome}</h4>
                          {semEstoque && (
                            <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rose-700 ring-1 ring-zinc-950/[0.04]">
                              Sem estoque
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-sm font-medium tabular-nums tracking-tighter leading-[1.2] text-zinc-950">{formatMoney(prod.preco)}</p>
                      </div>

                      {!semEstoque ? (
                        <div className="mt-6 flex shrink-0 items-center justify-end gap-4">
                          {carrinhoItem && carrinhoItem.quantidade > 0 ? (
                            <>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-10 w-10 rounded-full border border-zinc-950/[0.06] bg-white text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-50 hover:text-[#B91C1C] hover:brightness-110 active:scale-[0.97]"
                                onClick={() => handleDecreaseFromCart(prod.id)}
                              >
                                <Minus className="h-4 w-4" strokeWidth={1.5} />
                              </Button>
                              <span className="min-w-[1.5rem] text-center font-mono text-lg font-semibold tabular-nums tracking-tighter leading-[1.2] text-zinc-950">
                                {carrinhoItem.quantidade}
                              </span>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-10 w-10 rounded-full border border-zinc-950/[0.06] bg-white text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:bg-zinc-50 hover:brightness-110 active:scale-[0.97]"
                                onClick={() => handleAddToCart(prod)}
                              >
                                <Plus className="h-4 w-4" strokeWidth={1.5} />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              className="h-11 rounded-full bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] px-8 font-semibold leading-[1.2] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,74,7,0.3)] active:scale-[0.97]"
                              onClick={() => handleAddToCart(prod)}
                            >
                              <Plus className="mr-1 h-4 w-4" strokeWidth={1.5} /> Add
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 flex justify-end">
                          <Button disabled className="h-10 rounded-full bg-zinc-200/80 text-zinc-500">
                            Esgotado
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Campo observação opcional */}
          <div className="mt-12 space-y-8">
            <h4 className="text-[13px] font-medium leading-[1.2] text-zinc-500">Observações adicionais</h4>
            <Textarea 
              placeholder="Ex: Assar bem a chipa, separadas..." 
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="min-h-[96px] resize-none rounded-2xl border border-zinc-950/[0.06] bg-white text-sm leading-[1.2] ring-1 ring-zinc-950/[0.04] transition-all duration-200 ease-in-out focus-visible:border-orange-500/30 focus-visible:ring-2 focus-visible:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Rodapé (Sticky Footer / Carrinho) */}
        {carrinho.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-950/[0.03] bg-white/80 p-8 shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.06)] backdrop-blur-[12px] ring-1 ring-zinc-950/[0.04] sm:p-12 relative z-10">
            <div className="mb-8 flex items-start justify-between gap-8">
              <div className="flex min-w-0 flex-1 items-start gap-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 ring-1 ring-zinc-950/[0.04]">
                  <ShoppingBag className="h-5 w-5 text-zinc-900" strokeWidth={1} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[13px] font-medium leading-[1.2] text-zinc-500">Pedido</p>
                  <p className="truncate text-[13px] font-medium leading-[1.2] text-zinc-600">
                    {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="font-mono text-2xl font-semibold tabular-nums tracking-tighter leading-[1.2] text-zinc-950 sm:text-3xl">
                    {formatMoney(totalCarrinho)}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] font-sans text-base font-semibold leading-[1.2] tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/[0.06] transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,74,7,0.3)] active:scale-[0.97] disabled:opacity-60"
              onClick={handleSavePedido}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : (pedidoEdicao ? 'Salvar Alterações' : 'Adicionar Pedido à Fila')}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
