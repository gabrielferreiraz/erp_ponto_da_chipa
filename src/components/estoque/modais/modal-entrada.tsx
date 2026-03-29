'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'

interface ModalEntradaProps {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

export function ModalEntrada({ produto, onClose, onSuccess }: ModalEntradaProps) {
  const [quantidade, setQuantidade] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (quantidade <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }

    if (!produto) return

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade: quantidade
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao registrar entrada')
      }

      toast.success('Entrada registrada com sucesso!')
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
          <DialogTitle>Entrada de Mercadoria</DialogTitle>
          <DialogDescription>
            Registre a chegada de novos produtos no Depósito.
            <br />
            <strong>Produto:</strong> {produto?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade recebida</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Registrar Entrada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
