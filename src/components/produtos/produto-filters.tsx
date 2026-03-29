'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategorias } from '@/hooks/use-categorias'
import { ProdutoFilters as FiltersType } from '@/hooks/use-produtos'
import { Search } from 'lucide-react'

interface Props {
  filters: FiltersType
  onChange: (f: FiltersType) => void
}

export function ProdutoFilters({ filters, onChange }: Props) {
  const { categorias } = useCategorias()

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input 
          className="pl-9 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500"
          placeholder="Buscar produto por nome..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Select value={filters.categoriaId} onValueChange={(v) => onChange({ ...filters, categoriaId: v })}>
          <SelectTrigger className="w-full sm:w-[200px] bg-zinc-50">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categorias.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
          <SelectTrigger className="w-full sm:w-[160px] bg-zinc-50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="disponivel">Exibir Disponíveis</SelectItem>
            <SelectItem value="indisponivel">Exibir Indisponíveis</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
