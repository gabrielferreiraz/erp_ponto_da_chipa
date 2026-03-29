'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { FilaItemFrontend, useFilaCaixa } from '@/hooks/use-fila-caixa'

interface ModalCancelamentoProps {
  item: FilaItemFrontend | null
  onClose: () => void
}

export function ModalCancelamento({ item, onClose }: ModalCancelamentoProps) {
  const [motivo, setMotivo] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate } = useFilaCaixa()

  useEffect(() => {
    if (item) {
      setQuantidade(item.quantidade)
      setMotivo('')
    }
  }, [item])

  const handleCancelar = async () => {
    if (motivo.trim().length < 5) {
      toast.error('O motivo deve ter pelo menos 5 caracteres')
      return
    }

    if (!item) return

    try {
      setIsSubmitting(true)
      const payload = {
        motivoCancelamento: motivo.trim(),
        quantidadeCancelada: Number(quantidade)
      }
      const res = await fetch(`/api/caixa/${item.id}/cancelar-item`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao cancelar o item')
      }

      toast.success('Item cancelado com sucesso.')
      mutate()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Item Faturado</DialogTitle>
          <DialogDescription>
            {item?.nomeSnapshot} - {item?.quantidade}x. 
            Esta ação não exime o pedido original, apenas o abate do subtotal exigindo um motivo auditável abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {item && item.quantidade > 1 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-zinc-600">Qtd a Cancelar:</h4>
              <input 
                 type="number" 
                 min={1} 
                 max={item.quantidade} 
                 value={quantidade}
                 onChange={e => setQuantidade(Number(e.target.value))}
                 className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-zinc-600">Motivo (obrigatório):</h4>
            <Textarea 
              placeholder="Ex: Produto caiu no salão..." 
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="resize-none focus-visible:ring-red-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Sair</Button>
           <Button variant="destructive" onClick={handleCancelar} disabled={isSubmitting}>
             {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
