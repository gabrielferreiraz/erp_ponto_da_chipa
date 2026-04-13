'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate as globalMutate } from 'swr'
import { Plus, Search, Minus, ShoppingBag, X, Flame } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer } from 'vaul'
import { Textarea } from '@/components/ui/textarea'
import { useProdutos } from '@/hooks/use-produtos'
import { usePedidosAtendente } from '@/hooks/use-pedidos-atendente'
import { useMesas } from '@/hooks/use-mesas'
import { useCategorias } from '@/hooks/use-categorias'
import { toast } from 'sonner'
import { PedidoFrontend } from '@/hooks/use-pedidos-atendente'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
  const { mesas, isLoading: loadingMesas } = useMesas()
  const { categorias } = useCategorias()
  const { mutate } = usePedidosAtendente()
  const mutateProdutos = () => globalMutate('/api/produtos?status=disponivel')
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const [tipo, setTipo] = useState<'LOCAL' | 'VIAGEM'>(pedidoEdicao?.tipo || 'LOCAL')
  const [mesaId, setMesaId] = useState<string | null>(pedidoEdicao?.mesaId || null)
  const [observacao, setObservacao] = useState(pedidoEdicao?.observacao || '')
  
  const [busca, setBusca] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Efeito para focar o input quando expandir a busca
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true })
    }
  }, [isSearchExpanded])

  // Efeito para subir o scroll apenas quando a busca mudar, mas com proteção para não subir o modal inteiro
  useEffect(() => {
    if (busca && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [busca])

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value)
  }
  const [carrinho, setCarrinho] = useState<CartItem[]>([])

  // Sincronizar carrinho ao abrir para edição
  useEffect(() => {
    if (open && pedidoEdicao) {
      setCarrinho(pedidoEdicao.itens.map(i => ({
        produtoId: i.produtoId,
        nome: i.nomeSnapshot,
        preco: Number(i.precoSnapshot),
        quantidade: i.quantidade,
        qtdVisor: 999,
      })))
      setTipo(pedidoEdicao.tipo)
      setMesaId(pedidoEdicao.mesaId)
      setObservacao(pedidoEdicao.observacao || '')
    } else if (open && !pedidoEdicao) {
      setCarrinho([])
      setTipo('LOCAL')
      setMesaId(null)
      setObservacao('')
    }
  }, [open, pedidoEdicao])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const produtosFiltrados = produtos
    .filter(p => {
      const matchesBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
      const matchesCategoria = categoriaAtiva === 'all' || p.categoriaId === categoriaAtiva
      return matchesBusca && matchesCategoria
    })
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))

  // Identificar top 2 de cada categoria para o badge
  const top2Ids = new Set<string>()
  const categs = categoriaAtiva === 'all' ? categorias.map(c => c.id) : [categoriaAtiva]
  
  categs.forEach(catId => {
    const topInCat = produtos
      .filter(p => p.categoriaId === catId)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 2)
    topInCat.forEach(p => top2Ids.add(p.id))
  })

  const totalCarrinho = carrinho.reduce((acc, curr) => acc + (curr.preco * curr.quantidade), 0)

  const handleAddToCart = (p: any) => {
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

    if (tipo === 'LOCAL' && !mesaId) {
      toast.error('Selecione uma mesa para consumo local.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        tipo,
        observacao: observacao.trim() || null,
        mesaId: tipo === 'LOCAL' ? mesaId : null,
        itens: carrinho.map(c => ({ produtoId: c.produtoId, quantidade: c.quantidade }))
      }

      // Se o pedido estiver em AGUARDANDO_COBRANCA, usamos rotas de caixa se houver itens novos
      if (pedidoEdicao?.orderStatus === 'AGUARDANDO_COBRANCA') {
        // Para simplificar e garantir atomicidade, usamos a rota de atualização padrão se permitida, 
        // ou disparamos as adições individuais. Como a rota PATCH /api/pedidos/[id] bloqueia não-ABERTO,
        // vamos usar a rota de adicionar-item do caixa para cada item novo.
        
        const itensOriginaisIds = new Set(pedidoEdicao.itens.map(i => i.produtoId))
        const itensNovos = carrinho.filter(c => !itensOriginaisIds.has(c.produtoId))

        if (itensNovos.length > 0) {
          toast.loading('Adicionando novos itens ao caixa...', { id: 'caixa-add' })
          for (const item of itensNovos) {
            await fetch(`/api/caixa/${pedidoEdicao.id}/adicionar-item`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ produtoId: item.produtoId, quantidade: item.quantidade })
            })
          }
          toast.success('Itens adicionados com sucesso!', { id: 'caixa-add' })
        }

        mutate()
        globalMutate('/api/caixa/fila')
        mutateProdutos()
        onOpenChange(false)
        return
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

      const novoPedido = await res.json()

      // Otimização para VIAGEM: Enviar direto para o caixa se for um novo pedido
      if (tipo === 'VIAGEM' && !pedidoEdicao) {
        toast.loading('Processando pedido para viagem...', { id: 'viagem-confirm' })
        
        const confirmRes = await fetch(`/api/pedidos/${novoPedido.id}/confirmar`, { method: 'PATCH' })
        
        if (!confirmRes.ok) {
          toast.error('Pedido criado, mas erro ao enviar para o caixa.', { id: 'viagem-confirm' })
        } else {
          toast.success('Pedido para viagem enviado direto ao caixa!', { id: 'viagem-confirm' })
        }
      } else {
        toast.success(pedidoEdicao ? 'Pedido atualizado!' : 'Pedido criado com sucesso!')
      }

      mutate()
      globalMutate('/api/caixa/fila')
      mutateProdutos()
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

  // Conteúdo Renderizado
  const renderContent = (
    <div className="flex flex-col h-full relative overflow-hidden">
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
      `}</style>
      
      <div className="grain-overlay" />

      {/* Header Fixo */}
      <div className="px-6 py-5 border-b border-zinc-950/[0.06] bg-white shrink-0 relative z-10 space-y-4 rounded-t-[10px] md:rounded-t-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-zinc-900">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 border border-red-100">
              <ShoppingBag className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{pedidoEdicao ? 'Editar Pedido' : 'Novo Pedido'}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Magical Search */}
            <motion.div 
              initial={false}
              animate={{ 
                width: isSearchExpanded ? (isDesktop ? 300 : 200) : 32,
                backgroundColor: isSearchExpanded ? "rgb(255 255 255)" : "rgb(244 244 245)"
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative flex items-center h-8 overflow-hidden rounded-full border border-zinc-950/[0.06] shadow-sm"
            >
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                className="flex items-center justify-center w-8 h-8 shrink-0 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {isSearchExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center flex-1 pr-2"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar..."
                      value={busca}
                      onChange={handleBuscaChange}
                      onFocus={(e) => e.target.scrollIntoView({ block: 'nearest', behavior: 'instant' })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchInputRef.current?.blur()
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-[13px] font-medium text-zinc-900 placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setBusca('')
                        setIsSearchExpanded(false)
                      }}
                      className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 text-zinc-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <button 
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Control - Ocultar em modo busca no mobile para ganhar espaço */}
        <AnimatePresence>
          {(!isSearchExpanded || isDesktop) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative flex p-1 bg-zinc-100 rounded-2xl w-full border border-zinc-950/[0.06]">
                {['LOCAL', 'VIAGEM'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTipo(option as 'LOCAL' | 'VIAGEM')}
                    className={cn(
                      "relative z-10 w-1/2 py-2.5 text-[13px] font-semibold tracking-tight rounded-xl transition-colors duration-200",
                      tipo === option ? "text-zinc-900" : "text-zinc-500"
                    )}
                  >
                    {option === 'LOCAL' ? 'Consumo Local' : 'Viagem'}
                    {tipo === option && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-zinc-950/[0.03]"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seleção de Mesa e Categorias */}
        <div className="space-y-4">
          <AnimatePresence>
            {tipo === 'LOCAL' && (!isSearchExpanded || isDesktop) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Mesa</label>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {loadingMesas ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-2xl bg-zinc-100 shimmer shrink-0" />
                    ))
                  ) : (
                    mesas.map((mesa) => {
                      const isOccupied = mesa.pedidos.length > 0
                      const isSelected = mesaId === mesa.id

                      return (
                        <button
                          key={mesa.id}
                          type="button"
                          onClick={() => !isOccupied && setMesaId(mesa.id)}
                          className={cn(
                            "relative flex-shrink-0 w-14 h-14 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                            isSelected
                              ? "bg-zinc-900 border-zinc-900 text-white shadow-lg scale-105"
                              : isOccupied
                                ? "bg-zinc-100 border-zinc-100 text-zinc-400 cursor-not-allowed opacity-60"
                                : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300"
                          )}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-tighter leading-none">Mesa</span>
                          <span className="text-lg font-black tabular-nums leading-none">{mesa.numero}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtro de Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoriaAtiva('all')}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                categoriaAtiva === 'all'
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : "bg-white border-zinc-100 text-zinc-500"
              )}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                  categoriaAtiva === cat.id
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-white border-zinc-100 text-zinc-500"
                )}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div 
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-8 pb-10 bg-[#FAFAFA] no-scrollbar"
      >
        <div className="grid grid-cols-1 gap-4">
          {produtosFiltrados.map((prod) => {
            const carrinhoItem = carrinho.find(c => c.produtoId === prod.id)
            const semEstoque = prod.qtdVisor <= 0
            const isTopSeller = top2Ids.has(prod.id)

            return (
              <div 
                key={prod.id} 
                className={cn(
                  "group relative flex gap-4 rounded-[20px] p-4 ring-1 transition-all duration-300",
                  semEstoque
                    ? 'bg-zinc-100 ring-zinc-950/[0.03] opacity-60'
                    : 'bg-white ring-zinc-950/[0.06] shadow-sm hover:shadow-md'
                )}
              >
                {/* Badge de Top Seller */}
                {isTopSeller && !semEstoque && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    Pop
                  </div>
                )}

                <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-[14px] bg-zinc-100/50 ring-1 ring-zinc-950/[0.04]">
                  {prod.imagemUrl && <img src={prod.imagemUrl} alt={prod.nome} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                </div>
                
                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate text-[14px] font-semibold leading-[1.2] tracking-tight text-zinc-900">{prod.nome}</h4>
                      {semEstoque && (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-700">Falta</span>
                      )}
                    </div>
                    <p className="font-mono text-[13px] mt-1 font-medium tabular-nums text-zinc-500">{formatMoney(prod.preco)}</p>
                  </div>

                  {!semEstoque && (
                    <div className="mt-3 flex items-center justify-end gap-3">
                      {carrinhoItem ? (
                        <>
                          <button 
                            className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                            onClick={() => handleDecreaseFromCart(prod.id)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[1.5rem] text-center font-mono text-[15px] font-bold tabular-nums text-zinc-900">
                            {carrinhoItem.quantidade}
                          </span>
                          <button 
                            className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
                            onClick={() => handleAddToCart(prod)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button 
                          className="h-8 px-4 rounded-full bg-zinc-900 text-[11px] font-semibold text-white hover:bg-zinc-800 transition-all active:scale-95"
                          onClick={() => handleAddToCart(prod)}
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <AnimatePresence>
          {(!isSearchExpanded || isDesktop) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-8 space-y-3 overflow-hidden"
            >
              <label className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500">Observações</label>
              <Textarea 
                placeholder="Ex: Assar bem, separados..." 
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                className="min-h-[80px] rounded-xl border-none shadow-sm bg-white text-[13px] ring-1 ring-zinc-950/[0.04]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Carrinho */}
      {carrinho.length > 0 && (
        <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-zinc-950/[0.04] shadow-lg z-20 md:rounded-b-[24px] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Total</span>
              <span className="font-mono text-xl font-black tabular-nums tracking-tighter text-zinc-900">
                {formatMoney(totalCarrinho)}
              </span>
            </div>
            
            <button 
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] text-white text-[13px] font-black uppercase tracking-widest shadow-md"
              onClick={handleSavePedido}
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : (pedidoEdicao ? 'SALVAR' : 'ENVIAR')}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-xl p-0 h-[80vh] md:h-[85vh] overflow-hidden rounded-2xl border-none shadow-2xl">
          {renderContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root 
      open={open} 
      onOpenChange={onOpenChange} 
      shouldScaleBackground
      disablePreventScroll={false} // Mantém o scroll do body bloqueado
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 h-[96dvh] bg-white rounded-t-2xl z-50 overflow-hidden flex flex-col focus:outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto my-4 shrink-0" />
          {renderContent}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
