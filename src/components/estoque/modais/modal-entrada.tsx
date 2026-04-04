'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'
import { PlusCircle, Loader2, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

const QUICK = [10, 20, 50, 100]

export function ModalEntrada({ produto, onClose, onSuccess }: Props) {
  const [quantidade, setQuantidade] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (produto) setQuantidade(0)
  }, [produto?.id])

  const handleClose = () => { setQuantidade(0); onClose() }

  const handleConfirm = async () => {
    if (quantidade <= 0) { toast.error('Informe uma quantidade válida'); return }
    if (!produto) return
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: produto.id, quantidade })
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao registrar entrada') }
      toast.success('Entrada registrada no depósito!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!produto} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm p-0 border-none shadow-[0_24px_60px_rgba(0,0,0,0.18)] rounded-[28px] overflow-hidden focus:outline-none [&>button]:text-white/70 [&>button]:top-5 [&>button]:right-5">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-emerald-600 to-emerald-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Entrada no Depósito</h2>
              <p className="text-emerald-200 text-[13px] font-medium mt-0.5 truncate max-w-[200px]">{produto?.nome}</p>
            </div>
          </div>
        </div>

        {/* Stock atual */}
        <div className="px-8 pt-6 pb-4">
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Warehouse className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Depósito Atual</p>
                <p className="text-3xl font-black tabular-nums text-zinc-900 leading-tight">{produto?.qtdEstoque ?? 0}</p>
              </div>
            </div>
            {quantidade > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Após entrada</p>
                <p className="text-3xl font-black tabular-nums text-emerald-600 leading-tight">
                  {(produto?.qtdEstoque ?? 0) + quantidade}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick qty */}
        <div className="px-8 pb-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Quantidade comum</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setQuantidade(q)}
                className={cn(
                  "h-10 rounded-xl text-sm font-black transition-all border",
                  quantidade === q
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-8 pb-6">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Quantidade recebida</p>
          <input
            type="number"
            min={1}
            value={quantidade || ''}
            onChange={e => setQuantidade(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            className="w-full h-14 text-center text-2xl font-black font-mono bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || quantidade <= 0}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Entrada'}
          </button>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full h-11 text-[11px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
