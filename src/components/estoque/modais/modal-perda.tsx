'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'

interface ModalPerdaProps {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

export function ModalPerda({ produto, onClose, onSuccess }: ModalPerdaProps) {
  const [quantidade, setQuantidade] = useState<number>(0)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (quantidade <= 0) {
      toast.error('Informe uma quantidade de perda válida')
      return
    }
    if (motivo.length < 5) {
      toast.error('Informe um motivo com pelo menos 5 caracteres')
      return
    }

    if (!produto) return

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/perda', {
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
        throw new Error(err.error || 'Erro ao registrar perda')
      }

      toast.success('Registro de perda efetuado!')
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
      <DialogContent className="sm:max-w-md border-red-200">
        <DialogHeader>
          <DialogTitle className="text-red-600">Registrar Perda (Visor)</DialogTitle>
          <DialogDescription>
            Informe produtos perdidos diretamente do Salão (Visor).
            <br />
            <strong>Produto:</strong> {produto?.nome}
            <br />
            <strong>Disponível no Visor:</strong> {produto?.qtdVisor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade perdida</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              min={1}
              max={produto?.qtdVisor}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Perda</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Quebra em balcão, validade..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Confirmar Perda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
