'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie o catálogo de produtos e os estoques de vitrine do sistema.
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
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
