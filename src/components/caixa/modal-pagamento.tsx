'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { CheckCircle2, Banknote, CreditCard, ScanLine, Smartphone } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface ModalPagamentoProps {
  pedido: FilaPedidoFrontend | null
  onClose: () => void
}

type FormaPagto = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'

export function ModalPagamento({ pedido, onClose }: ModalPagamentoProps) {
  const [forma, setForma] = useState<FormaPagto>('DEBITO' as any)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { mutate } = useFilaCaixa()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handlePagar = async () => {
    if (!['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(forma)) {
      toast.error('Selecione uma forma de pagamento válida')
      return
    }
    if (!pedido) return

    try {
      setIsSubmitting(true)
      
      const payload = {
        formaPagamento: forma,
        idempotencyKey: crypto.randomUUID()
      }

      const res = await fetch(`/api/caixa/${pedido.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409 || err.error?.includes('conflito') || err.error?.includes('faturado')) {
           throw new Error('Opa, este pedido acabou de ser recebido por outro caixa!')
        }
        throw new Error(err.error || 'Erro ao faturar pedido')
      }

      setShowSuccess(true)
      mutate() // SWR revali dando instantaneamente a fila base
      
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 1000)

    } catch (error: any) {
      toast.error(error.message, { 
        duration: 8000, 
        icon: <AlertCircle className="w-5 h-5 text-red-500" /> 
      })
      onClose() // Evita travar a tela em caso de conflito
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pedido) return null
  
  const total = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)

  const InnerContent = () => (
    <>
      <div className={cn("px-6 pb-2 pt-6 sm:px-0 sm:pt-0 sm:pb-4", !isDesktop && "border-b border-zinc-950/[0.04] mb-4")}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Faturar {pedido.codigo}
          </h2>
          <span className="font-mono text-xl font-bold tabular-nums tracking-tighter text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
            {formatMoney(total)}
          </span>
        </div>
        <p className="text-[13px] font-medium text-zinc-500">
          Selecione o meio de pagamento do cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 sm:px-0 mb-6">
        <Button 
          disabled={isSubmitting || showSuccess}
          variant={forma === 'DINHEIRO' ? 'default' : 'outline'} 
          className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
          onClick={() => setForma('DINHEIRO')}
        >
          <Banknote className="h-5 w-5" strokeWidth={forma === 'DINHEIRO' ? 2.5 : 1.5} /> Dinheiro
        </Button>

        <Button 
          disabled={isSubmitting || showSuccess}
          variant={forma === 'PIX' ? 'default' : 'outline'} 
          className={cn(
            "h-16 flex flex-col gap-1 items-center justify-center font-bold",
            forma === 'PIX' ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
          )}
          onClick={() => setForma('PIX')}
        >
          <ScanLine className="h-5 w-5" strokeWidth={forma === 'PIX' ? 2.5 : 1.5} /> PIX
        </Button>

        <Button 
          disabled={isSubmitting || showSuccess}
          variant={forma === 'CARTAO_DEBITO' ? 'default' : 'outline'} 
          className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
          onClick={() => setForma('CARTAO_DEBITO')}
        >
          <CreditCard className="h-5 w-5" strokeWidth={forma === 'CARTAO_DEBITO' ? 2.5 : 1.5} /> Débito
        </Button>

        <Button 
          disabled={isSubmitting || showSuccess}
          variant={forma === 'CARTAO_CREDITO' ? 'default' : 'outline'} 
          className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
          onClick={() => setForma('CARTAO_CREDITO')}
        >
          <Smartphone className="h-5 w-5" strokeWidth={forma === 'CARTAO_CREDITO' ? 2.5 : 1.5} /> Crédito
        </Button>
      </div>

      <div className="px-6 pb-6 sm:px-0 sm:pb-0 flex flex-col gap-3 mt-auto">
         <Button 
           variant="default" 
           onClick={handlePagar} 
           disabled={isSubmitting || showSuccess || !['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(forma)} 
           className={cn(
             "h-16 w-full font-black text-[15px] uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(20,184,166,0.3),0_2px_8px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98]",
             showSuccess ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gradient-to-r from-[#F29100] via-[#E24A07] to-[#B91C1C] hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(226,74,7,0.35),0_2px_8px_rgba(0,0,0,0.1)]"
           )}
         >
           {isSubmitting ? <span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span> : showSuccess ? (
             <span className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6" /> RECEBIDO COM SUCESSO!</span>
           ) : (
             <>CONFIRMAR RECEBIMENTO</>
           )}
         </Button>
         <Button variant="outline" onClick={onClose} disabled={isSubmitting || showSuccess} className="h-14 w-full sm:hidden font-bold text-zinc-500">CANCELAR</Button>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={!!pedido} onOpenChange={(open) => { if (!isSubmitting) onClose() }}>
        <DialogContent className="sm:max-w-md p-6 border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] sm:rounded-[24px]">
          <InnerContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root open={!!pedido} onOpenChange={(open) => { if (!open && !isSubmitting && !showSuccess) onClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] bg-white shadow-[0_-24px_48px_-12px_rgba(0,0,0,0.15)] focus:outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-4 mb-2" />
          <InnerContent />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}
