'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Banknote, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface ModalMovimentacaoProps {
  isOpen: boolean
  onClose: () => void
}

type Tipo = 'FUNDO_INICIAL' | 'SANGRIA' | 'SUPRIMENTO'

export function ModalMovimentacao({ isOpen, onClose }: ModalMovimentacaoProps) {
  const [tipo, setTipo] = useState<Tipo>('SUPRIMENTO')
  const [valor, setValor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const num = parseFloat(valor.replace(',', '.'))
    if (isNaN(num) || num <= 0) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/caixa/movimentacoes', {
        method: 'POST',
        body: JSON.stringify({ tipo, valor: num, observacao })
      })

      if (!res.ok) throw new Error('Falha ao registrar')
      
      toast.success('Movimentação registrada com sucesso!')
      onClose()
      setValor('')
      setObservacao('')
    } catch (error) {
      toast.error('Erro ao registrar movimentação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl">
        <DialogHeader className="space-y-1 mb-4">
          <DialogTitle className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            Movimentação de Caixa
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Adicione ou remova valores não oriundos de vendas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo('SUPRIMENTO')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                tipo === 'SUPRIMENTO' 
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700" 
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300"
              )}
            >
              <ArrowDownRight className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-widest">Entrada/Suprimento</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo('SANGRIA')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                tipo === 'SANGRIA' 
                  ? "border-amber-600 bg-amber-50 text-amber-700" 
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300"
              )}
            >
              <ArrowUpRight className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-widest">Retirada/Sangria</span>
            </button>
          </div>

          {(tipo === 'SUPRIMENTO' || tipo === 'FUNDO_INICIAL') && (
            <button
              type="button"
              onClick={() => setTipo('FUNDO_INICIAL')}
              className={cn(
                "w-full p-3 rounded-xl border-2 transition-all text-xs font-black uppercase tracking-widest",
                tipo === 'FUNDO_INICIAL'
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-鋅-50 hover:border-zinc-300"
              )}
            >
              Definir como Fundo de Caixa Inicial
            </button>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor do Montante</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="w-full h-14 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-lg font-black text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observação (Obrigatório para Sangria)</Label>
              <Input 
                value={observacao} 
                onChange={e => setObservacao(e.target.value)} 
                required={tipo === 'SANGRIA'}
                placeholder="Motivo ou recebedor..."
                className="h-12 bg-zinc-50 border-zinc-200 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl text-zinc-500 font-bold hover:bg-zinc-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !valor}
              className="flex-1 h-12 flex justify-center items-center rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
