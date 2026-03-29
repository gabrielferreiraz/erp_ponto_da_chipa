'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CategoriaTable } from '@/components/categorias/categoria-table'
import { CategoriaFormDialog } from '@/components/categorias/categoria-form-dialog'
import { Button } from '@/components/ui/button'
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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Categorias</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie as categorias de produtos e suas ordens de exibição.
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
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
