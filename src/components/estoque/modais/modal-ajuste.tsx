'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ProdutoEstoqueFrontend } from '@/hooks/use-estoque'
import { SlidersHorizontal, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  produto: ProdutoEstoqueFrontend | null
  onClose: () => void
  onSuccess: () => void
}

const QUICK = [-5, -3, -1, +1, +3, +5]

export function ModalAjuste({ produto, onClose, onSuccess }: Props) {
  const [quantidade, setQuantidade] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (produto) { setQuantidade(0); setMotivo('') }
  }, [produto?.id])

  const handleClose = () => { setQuantidade(0); setMotivo(''); onClose() }

  const handleConfirm = async () => {
    if (quantidade === 0) { toast.error('Informe uma diferença de ajuste'); return }
    if (motivo.trim().length < 5) { toast.error('Descreva o motivo (mín. 5 caracteres)'); return }
    if (!produto) return
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/estoque/ajuste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: produto.id, quantidade, motivo: motivo.trim() })
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao realizar ajuste') }
      toast.success('Ajuste registrado com sucesso!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resultante = (produto?.qtdVisor ?? 0) + quantidade

  return (
    <Dialog open={!!produto} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm p-0 border-none shadow-[0_24px_60px_rgba(0,0,0,0.18)] rounded-[28px] overflow-hidden focus:outline-none [&>button]:text-white/70 [&>button]:top-5 [&>button]:right-5">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-violet-600 to-violet-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Ajuste Manual</h2>
              <p className="text-violet-200 text-[13px] font-medium mt-0.5 truncate max-w-[200px]">{produto?.nome}</p>
            </div>
          </div>
        </div>

        {/* Visor atual → resultante */}
        <div className="px-8 pt-6 pb-4">
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visor Atual</p>
              <p className="text-3xl font-black tabular-nums text-zinc-900 leading-tight">{produto?.qtdVisor ?? 0}</p>
            </div>
            {quantidade !== 0 && (
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Resultado</p>
                <p className={cn(
                  "text-3xl font-black tabular-nums leading-tight",
                  resultante < 0 ? "text-rose-600" : "text-violet-600"
                )}>{resultante}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick delta buttons */}
        <div className="px-8 pb-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Ajuste rápido (Visor)</p>
          <div className="grid grid-cols-6 gap-1.5">
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setQuantidade(q)}
                className={cn(
                  "h-10 rounded-xl text-sm font-black transition-all border",
                  quantidade === q
                    ? q < 0
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-violet-600 text-white border-violet-600"
                    : q < 0
                      ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                      : "bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100"
                )}
              >
                {q > 0 ? `+${q}` : q}
              </button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <div className="px-8 pb-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Diferença personalizada</p>
          <input
            type="number"
            value={quantidade || ''}
            onChange={e => setQuantidade(Number(e.target.value))}
            placeholder="0"
            className="w-full h-14 text-center text-2xl font-black font-mono bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          />
          <p className="text-[10px] text-zinc-400 text-center mt-1.5">Use negativo para remover, positivo para adicionar</p>
        </div>

        {/* Motivo */}
        <div className="px-8 pb-6">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Motivo do ajuste</p>
          <textarea
            rows={2}
            placeholder="Ex: Contagem física divergiu, balcão..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-[13px] font-medium text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || quantidade === 0 || motivo.trim().length < 5}
            className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-violet-600/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Ajuste'}
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
