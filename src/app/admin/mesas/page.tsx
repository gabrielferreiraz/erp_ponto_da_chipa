'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Table2, Trash2, Edit3, Loader2, X, Check, Search, MapPin, Power } from 'lucide-react'
import { getMesasAction, upsertMesaAction, toggleMesaStatusAction, deleteMesaAction } from '@/actions/mesas'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function MesasPage() {
  const [mesas, setMesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMesa, setEditingMesa] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const loadMesas = async () => {
    try {
      const data = await getMesasAction()
      setMesas(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMesas() }, [])

  const handleToggleStatus = async (mesa: any) => {
    try {
      await toggleMesaStatusAction(mesa.id, mesa.ativa)
      toast.success(`Mesa ${mesa.ativa ? 'desativada' : 'ativada'} com sucesso`)
      loadMesas()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mesa permanentemente?')) return
    try {
      await deleteMesaAction(id)
      toast.success('Mesa removida')
      loadMesas()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const numero = formData.get('numero')
    const ativa = formData.get('ativa') === 'on'
    
    startTransition(async () => {
      try {
        await upsertMesaAction({ id: editingMesa?.id, numero, ativa })
        toast.success(editingMesa ? 'Mesa atualizada' : 'Mesa cadastrada')
        setIsModalOpen(false)
        setEditingMesa(null)
        loadMesas()
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Mesas</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Configuração do Salão</p>
        </div>

        <button 
          onClick={() => { setEditingMesa(null); setIsModalOpen(true); }}
          className="h-12 px-6 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-zinc-900/10"
        >
          <Plus className="w-4 h-4" /> ADICIONAR MESA
        </button>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-zinc-100 animate-pulse" />
          ))
        ) : mesas.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-zinc-200 rounded-[32px] flex flex-col items-center gap-4 text-center">
            <div className="bg-zinc-50 p-6 rounded-full">
              <Table2 className="w-10 h-10 text-zinc-200" strokeWidth={1} />
            </div>
            <p className="text-zinc-400 font-medium uppercase text-[10px] tracking-widest">Nenhuma mesa cadastrada</p>
          </div>
        ) : (
          mesas.map((mesa) => (
            <motion.div
              key={mesa.id}
              layout
              className="group relative bg-white border border-zinc-200/60 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all duration-300 active:scale-[0.98]"
            >
              {/* Status Indicator */}
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  mesa.ativa 
                    ? mesa.pedidos.length > 0 
                      ? "bg-orange-50 text-orange-600 border-orange-100" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-zinc-100 text-zinc-400 border-zinc-200"
                )}>
                  {mesa.ativa ? (mesa.pedidos.length > 0 ? 'Ocupada' : 'Livre') : 'Inativa'}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMesa(mesa); setIsModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(mesa.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 py-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mesa</span>
                <span className="text-4xl font-black text-zinc-900 tabular-nums tracking-tighter leading-none">{mesa.numero}</span>
              </div>

              <button 
                onClick={() => handleToggleStatus(mesa)}
                className={cn(
                  "mt-4 w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  mesa.ativa ? "bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-600" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                )}
              >
                {mesa.ativa ? 'Desativar' : 'Ativar'}
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-[400px] bg-white rounded-[40px] shadow-2xl border border-zinc-200/50 overflow-hidden">
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">{editingMesa ? 'Editar Mesa' : 'Nova Mesa'}</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Configuração de Ponto de Venda</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Número da Mesa</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input type="number" name="numero" defaultValue={editingMesa?.numero} required className="w-full h-14 pl-11 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-xl font-black focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" placeholder="00" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <input type="checkbox" name="ativa" defaultChecked={editingMesa ? editingMesa.ativa : true} className="w-5 h-5 rounded-lg border-zinc-200 text-zinc-900 focus:ring-zinc-900/10" id="ativa" />
                    <label htmlFor="ativa" className="text-sm font-bold text-zinc-700 cursor-pointer">Mesa Habilitada para Pedidos</label>
                  </div>

                  <button disabled={isPending} type="submit" className="w-full h-16 bg-zinc-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> {editingMesa ? 'ATUALIZAR' : 'CADASTRAR'}</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
