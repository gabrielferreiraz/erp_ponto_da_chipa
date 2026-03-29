'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useFilaCaixa, FilaPedidoFrontend } from '@/hooks/use-fila-caixa'
import { CheckCircle2, Banknote, CreditCard, ScanLine, Smartphone } from 'lucide-react'

interface ModalPagamentoProps {
  pedido: FilaPedidoFrontend | null
  onClose: () => void
}

type FormaPagto = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'

export function ModalPagamento({ pedido, onClose }: ModalPagamentoProps) {
  const [forma, setForma] = useState<FormaPagto>('DEBITO' as any) // fake default para force select
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate } = useFilaCaixa()

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
        throw new Error(err.error || 'Erro ao faturar pedido')
      }

      toast.success('Faturado com sucesso!')
      mutate() // O fallback force mutate visual aqui
      onClose()
    } catch (error: any) {
      toast.error(error.message, { 
        duration: 8000, 
        icon: <AlertCircle className="w-5 h-5 text-red-500" /> 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pedido) return null
  
  // Total dinâmico (não dependemos 100% do backend atualizado, fazemos predict frontal)
  const total = pedido.itens.reduce((acc, curr) => acc + (Number(curr.precoSnapshot) * curr.quantidade), 0)

  return (
    <Dialog open={!!pedido} onOpenChange={(open) => {
      // Impede fechar clicando fundo se isSubmitting
      if (!isSubmitting) onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            Faturar {pedido.codigo}
            <span className="text-emerald-500">{formatMoney(total)}</span>
          </DialogTitle>
          <DialogDescription>Selecione o meio de pagamento para consolidar a transação destas comandas.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-6">
          <Button 
            disabled={isSubmitting}
            variant={forma === 'DINHEIRO' ? 'default' : 'outline'} 
            className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
            onClick={() => setForma('DINHEIRO')}
          >
            <Banknote className="h-5 w-5" /> Dinheiro
          </Button>

          <Button 
            disabled={isSubmitting}
            variant={forma === 'PIX' ? 'default' : 'outline'} 
            className="h-16 flex flex-col gap-1 items-center justify-center font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white" 
            onClick={() => setForma('PIX')}
            data-state={forma === 'PIX' ? "active" : "inactive"}
          >
            <ScanLine className="h-5 w-5" /> PIX
          </Button>

          <Button 
            disabled={isSubmitting}
            variant={forma === 'CARTAO_DEBITO' ? 'default' : 'outline'} 
            className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
            onClick={() => setForma('CARTAO_DEBITO')}
          >
            <CreditCard className="h-5 w-5" /> Débito
          </Button>

          <Button 
            disabled={isSubmitting}
            variant={forma === 'CARTAO_CREDITO' ? 'default' : 'outline'} 
            className="h-16 flex flex-col gap-1 items-center justify-center font-bold" 
            onClick={() => setForma('CARTAO_CREDITO')}
          >
            <Smartphone className="h-5 w-5" /> Crédito
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
           <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-12 w-full">Sair</Button>
           <Button variant="default" onClick={handlePagar} disabled={isSubmitting || !['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(forma)} className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-lg">
             {isSubmitting ? <span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span> : (
               <>Cobrar {formatMoney(total)} <CheckCircle2 className="ml-2 h-5 w-5" /></>
             )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
