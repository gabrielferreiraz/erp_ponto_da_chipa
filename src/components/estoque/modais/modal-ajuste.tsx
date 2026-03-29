'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'

interface ModalAjusteProps {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

export function ModalAjuste({ produto, onClose, onSuccess }: ModalAjusteProps) {
  const [quantidade, setQuantidade] = useState<number>(0)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (quantidade === 0) {
      toast.error('Informe uma quantidade de ajuste')
      return
    }
    if (motivo.length < 5) {
      toast.error('Informe um motivo com pelo menos 5 caracteres')
      return
    }

    if (!produto) return

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/ajuste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade: quantidade,
          motivo: motivo.trim()
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao realizar ajuste')
      }

      toast.success('Ajuste de visor realizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!produto} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste Manual (Visor)</DialogTitle>
          <DialogDescription>
            Corrija manualmente a quantidade disponível no Salão (Visor).
            <br />
            Use números positivos para adicionar e negativos para remover.
            <br />
            <strong>Produto:</strong> {produto?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Diferença de ajuste</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Ajuste</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Contagem física de balcão..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Registrar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
