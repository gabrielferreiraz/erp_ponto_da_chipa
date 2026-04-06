'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CategoriaTable } from '@/components/categorias/categoria-table'
import { CategoriaFormDialog } from '@/components/categorias/categoria-form-dialog'
import { CategoriaWithCount } from '@/hooks/use-categorias'

export default function CategoriasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categoriaEdit, setCategoriaEdit] = useState<CategoriaWithCount | null>(null)
  
  const handleEdit = (categoria: CategoriaWithCount) => {
    setCategoriaEdit(categoria)
    setIsDialogOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setCategoriaEdit(null), 200) // Delay for closing animation
    }
    setIsDialogOpen(open)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Categorias</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Organização do Catálogo</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <CategoriaTable onEdit={handleEdit} />
      
      <CategoriaFormDialog 
        open={isDialogOpen} 
        onOpenChange={handleOpenChange} 
        categoria={categoriaEdit}
      />
    </div>
  )
}
