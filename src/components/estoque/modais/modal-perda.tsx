'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'
import { MinusCircle, Loader2, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

const QUICK = [1, 2, 3, 5]
const MOTIVOS_RAPIDOS = ['Vencimento', 'Quebra/Queda', 'Amostral', 'Consumo interno']

export function ModalPerda({ produto, onClose, onSuccess }: Props) {
  const [quantidade, setQuantidade] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (produto) { setQuantidade(0); setMotivo('') }
  }, [produto?.id])

  const handleClose = () => { setQuantidade(0); setMotivo(''); onClose() }

  const handleConfirm = async () => {
    if (quantidade <= 0) { toast.error('Informe a quantidade perdida'); return }
    if (motivo.trim().length < 5) { toast.error('Descreva o motivo da perda (mín. 5 caracteres)'); return }
    if (!produto) return
    if (quantidade > produto.qtdVisor) {
      toast.error(`Visor tem apenas ${produto.qtdVisor} unidades disponíveis`)
      return
    }
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/perda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: produto.id, quantidade, motivo: motivo.trim() })
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao registrar perda') }
      toast.success('Perda registrada no sistema.')
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
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-rose-600 to-rose-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <MinusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Registrar Perda</h2>
              <p className="text-rose-200 text-[13px] font-medium mt-0.5 truncate max-w-[200px]">{produto?.nome}</p>
            </div>
          </div>
        </div>

        {/* Visor atual */}
        <div className="px-8 pt-6 pb-4">
          <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-rose-400" />
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Visor</p>
                <p className="text-3xl font-black tabular-nums text-rose-700 leading-tight">{produto?.qtdVisor ?? 0}</p>
              </div>
            </div>
            {quantidade > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Após perda</p>
                <p className="text-3xl font-black tabular-nums text-rose-900 leading-tight">
                  {Math.max(0, (produto?.qtdVisor ?? 0) - quantidade)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick qty */}
        <div className="px-8 pb-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Quantidade perdida</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setQuantidade(q)}
                className={cn(
                  "h-10 rounded-xl text-sm font-black transition-all border",
                  quantidade === q
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                )}
              >
                {q}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={produto?.qtdVisor}
            value={quantidade || ''}
            onChange={e => setQuantidade(Math.max(0, Number(e.target.value)))}
            placeholder="Outro..."
            className="w-full h-11 mt-2 text-center text-xl font-black font-mono bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
          />
        </div>

        {/* Motivo rápido */}
        <div className="px-8 pb-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Motivo</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {MOTIVOS_RAPIDOS.map(m => (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                  motivo === m
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-rose-300 hover:text-rose-600"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="Ou descreva o motivo aqui..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-[13px] font-medium text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || quantidade <= 0 || motivo.trim().length < 5}
            className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Perda'}
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
