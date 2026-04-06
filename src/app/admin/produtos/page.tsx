'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ProdutoTable } from '@/components/produtos/produto-table'
import { ProdutoFilters as FiltersComponent } from '@/components/produtos/produto-filters'
import { ProdutoFormDialog } from '@/components/produtos/produto-form-dialog'
import { ProdutoFilters, ProdutoFrontend } from '@/hooks/use-produtos'

export default function ProdutosPage() {
  const [filters, setFilters] = useState<ProdutoFilters>({
    search: '',
    categoriaId: 'all',
    status: 'all'
  })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [produtoEdit, setProdutoEdit] = useState<ProdutoFrontend | null>(null)

  const handleEdit = (produto: ProdutoFrontend) => {
    setProdutoEdit(produto)
    setIsDialogOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setProdutoEdit(null), 200)
    }
    setIsDialogOpen(open)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Produtos</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Catálogo & Estoque de Vitrine</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="space-y-4">
        <FiltersComponent filters={filters} onChange={setFilters} />
        <ProdutoTable filters={filters} onEdit={handleEdit} />
      </div>
      
      <ProdutoFormDialog 
        open={isDialogOpen} 
        onOpenChange={handleOpenChange} 
        produto={produtoEdit}
      />
    </div>
  )
}
