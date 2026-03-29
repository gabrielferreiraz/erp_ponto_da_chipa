'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    if (min < 10) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (min <= 20) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-zinc-50/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Fila do Caixa</h1>
          <p className="text-zinc-500 mt-1">
            Pedidos aguardando faturamento (Tempo real via SSE)
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-200 items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-zinc-700">{fila.length} Pedidos Ativos</span>
          </div>

          <Button 
            variant="outline" 
            onClick={() => logoutAction()}
            className="flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold px-4 py-2 rounded-xl h-[42px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair do Sistema</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center pt-20 text-zinc-400">
           <span className="animate-spin h-8 w-8 border-2 border-zinc-400 border-t-transparent rounded-full mb-4"></span>
           Sincronizando fila...
        </div>
      )}

      {!isLoading && fila.length === 0 && (
         <div className="text-center pt-32 px-8 text-zinc-400 bg-white border border-zinc-200 border-dashed rounded-3xl py-24">
           <Banknote className="h-16 w-16 mx-auto mb-4 text-zinc-200" />
           <p className="font-medium text-zinc-500 text-lg">Nenhum pedido aguardando cobrança.</p>
           <p className="text-sm mt-1">O salão está vazio ou fluido no momento.</p>
         </div>
      )}

      {/* Grid Desktop Responsive: 1 coluna no celular, 2 tablet, 3 PC, 4 Ultra wide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {fila.map(pedido => {
          const totalAtivo = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)

          return (
            <Card key={pedido.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow border-zinc-200/60 duration-300">
              
              <CardHeader className="bg-white pb-3 pt-5 border-b border-zinc-100 px-5">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1.5">
                    <Badge variant={pedido.tipo === 'LOCAL' ? 'default' : 'secondary'} className="w-fit font-bold shadow-sm">
                      {pedido.tipo === 'LOCAL' ? <MapPin className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                      {pedido.tipo} {pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : ''}
                    </Badge>
                    <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">{pedido.codigo}</CardTitle>
                  </div>
                  
                  <Badge variant="outline" className={`font-semibold shadow-sm flex items-center gap-1 w-fit ${getTempoBadgeCor(pedido.criadoEm)}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(pedido.criadoEm)}
                  </Badge>
                </div>
                {pedido.atendente && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mt-2 bg-zinc-50 w-fit px-2 py-1 rounded-md">
                     <UserCircle className="w-4 h-4" /> Atendente: {pedido.atendente.nome.split(' ')[0]}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 p-5 bg-zinc-50/50">
                <div className="space-y-3">
                  {pedido.itens.length === 0 ? (
                    <p className="text-sm text-zinc-400 italic">Todos os itens cancelados.</p>
                  ) : pedido.itens.map(item => (
                    <div key={item.id} className="group flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-zinc-200/60 shadow-sm transition-all hover:border-red-200">
                      <div className="truncate pr-2 max-w-[180px]">
                        <span className="font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded mr-1.5">{item.quantidade}x</span>
                        <span className="font-medium text-zinc-800">{item.nomeSnapshot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-700">{formatMoney(item.precoSnapshot * item.quantidade)}</span>
                        
                        <Button
                           size="icon"
                           variant="ghost"
                           className="h-7 w-7 text-rose-400 hover:text-white hover:bg-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-md"
                           onClick={() => setCancelarItem(item)}
                           title="Cancelar Item"
                        >
                           <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {pedido.observacao && (
                  <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/50 text-amber-800 text-xs font-medium rounded-lg">
                    <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-1 block">Observação</span>
                    {pedido.observacao}
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-5 bg-white border-t border-zinc-100 flex items-center justify-between">
                <div>
                   <p className="text-xs text-zinc-400 font-semibold mb-0.5">TOTAL A COBRAR</p>
                   <p className="text-2xl font-black text-emerald-600 leading-none">{formatMoney(totalAtivo)}</p>
                </div>

                <Button 
                   size="lg" 
                   className="font-bold bg-zinc-900 hover:bg-emerald-600 text-white shadow-lg transition-colors px-6 h-12 rounded-xl"
                   onClick={() => setPagarPedido(pedido)}
                   disabled={pedido.itens.length === 0}
                >
                  <Banknote className="h-5 w-5 mr-2 -ml-1" /> Cobrar
                </Button>
              </CardFooter>

            </Card>
          )
        })}
      </div>

      <ModalCancelamento item={cancelarItem} onClose={() => setCancelarItem(null)} />
      <ModalPagamento pedido={pagarPedido} onClose={() => setPagarPedido(null)} />
    </div>
  )
}
