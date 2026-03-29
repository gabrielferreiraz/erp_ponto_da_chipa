'use client'

import { useState } from 'react'
import { Plus, Search, Minus, ShoppingBag, X, Send, AlertCircle, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <DialogContent className="max-w-md w-full p-0 h-[100dvh] sm:h-[90vh] flex flex-col gap-0 border-none sm:rounded-xl overflow-hidden shadow-2xl bg-zinc-50">
        
        {/* Header Fixo */}
        <DialogHeader className="p-4 bg-white border-b border-zinc-100 flex-none space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {pedidoEdicao ? `Editando ${pedidoEdicao.codigo}` : 'Novo Pedido'}
            </DialogTitle>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant={tipo === 'LOCAL' ? 'default' : 'outline'} 
              className="flex-1"
              onClick={() => setTipo('LOCAL')}
            >
              Consumo Local
            </Button>
            <Button 
              type="button" 
              variant={tipo === 'VIAGEM' ? 'default' : 'outline'} 
              className="flex-1"
              onClick={() => setTipo('VIAGEM')}
            >
              Viagem
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar chinela, chipa..." 
              className="pl-9 h-10 bg-zinc-100 border-transparent focus-visible:bg-white" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </DialogHeader>

        {/* Corpo com Grid de Produtos */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {produtos.length === 0 ? (
             <div className="flex flex-col items-center justify-center pt-10 text-zinc-400">
               <span className="animate-spin h-6 w-6 border-2 border-zinc-400 border-t-transparent rounded-full mb-4"></span>
               Carregando cardápio...
             </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhum produto encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {produtosFiltrados.map((prod) => {
                const carrinhoItem = carrinho.find(c => c.produtoId === prod.id)
                const semEstoque = prod.qtdVisor <= 0

                return (
                  <div 
                    key={prod.id} 
                    className={`flex items-center justify-between p-3 bg-white rounded-xl border ${semEstoque ? 'opacity-60 border-zinc-100 bg-zinc-50' : 'border-zinc-200'}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-zinc-900 truncate">{prod.nome}</h4>
                        {semEstoque && <Badge variant="secondary" className="text-[10px] uppercase shrink-0">Sem Estoque</Badge>}
                      </div>
                      <p className="text-sm font-medium text-emerald-600">{formatMoney(prod.preco)}</p>
                    </div>

                    {!semEstoque ? (
                      <div className="flex items-center gap-3 shrink-0">
                        {carrinhoItem && carrinhoItem.quantidade > 0 ? (
                          <>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-10 w-10 rounded-full bg-zinc-50 hover:bg-zinc-100 hover:text-red-500"
                              onClick={() => handleDecreaseFromCart(prod.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-bold text-lg">{carrinhoItem.quantidade}</span>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-10 w-10 rounded-full bg-zinc-50 hover:bg-zinc-100 hover:text-emerald-500"
                              onClick={() => handleAddToCart(prod)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            className="h-10 px-4 rounded-full font-semibold"
                            onClick={() => handleAddToCart(prod)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button disabled className="h-10 px-4 rounded-full bg-zinc-300">
                        Esgotado
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Campo observação opcional */}
          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-sm text-zinc-600">Observações adicionais:</h4>
            <Textarea 
              placeholder="Ex: Assar bem a chipa, separadas..." 
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        {/* Rodapé (Sticky Footer / Carrinho) */}
        {carrinho.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-zinc-100 p-2 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-zinc-900" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">{carrinho.length} itens no pedido</p>
                  <p className="text-lg font-bold text-zinc-900">{formatMoney(totalCarrinho)}</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base font-bold" 
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
