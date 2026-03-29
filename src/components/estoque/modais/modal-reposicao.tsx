'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'

interface ModalReposicaoProps {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

export function ModalReposicao({ produto, onClose, onSuccess }: ModalReposicaoProps) {
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
      const res = await fetch('/api/estoque/reposicao-visor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade: quantidade
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao repor visor')
      }

      toast.success('Reposição realizada com sucesso!')
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
          <DialogTitle>Repor Visor</DialogTitle>
          <DialogDescription>
            Transfira produtos do Depósito para o Visor (Salão).
            <br />
            <strong>Produto:</strong> {produto?.nome}
            <br />
            <strong>Disponível no Depósito:</strong> {produto?.qtdEstoque}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade a Transferir</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              min={1}
              max={produto?.qtdEstoque}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Confirmar Reposição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
