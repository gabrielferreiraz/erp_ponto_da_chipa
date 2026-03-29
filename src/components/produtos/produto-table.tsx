'use client'

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useProdutos, ProdutoFrontend, ProdutoFilters } from '@/hooks/use-produtos'
import { Loader2, MoreVertical, Edit2, Ban, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'

interface Props {
  filters: ProdutoFilters
  onEdit: (produto: ProdutoFrontend) => void
}

export function ProdutoTable({ filters, onEdit }: Props) {
  const { produtos, isLoading, isError, mutate } = useProdutos(filters)

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao alternar status do produto')
      }
      toast.success(`Este produto agora está ${currentStatus ? 'INDISPONÍVEL' : 'DISPONÍVEL'}`)
      mutate()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12 bg-white rounded-xl border border-zinc-200">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-red-500 bg-white rounded-xl border border-zinc-200 shadow-sm">
        Erro ao carregar o catálogo de produtos.
      </div>
    )
  }

  if (produtos.length === 0) {
    return (
      <div className="text-center p-12 text-zinc-500 bg-white rounded-xl border border-zinc-200 shadow-sm">
        Nenhum produto encontrado.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque / Visor</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((p) => {
            const hasStockAlert = p.qtdEstoque + p.qtdVisor <= p.estoqueMinimo
            
            return (
              <TableRow key={p.id} className={!p.disponivel ? 'opacity-60 bg-zinc-50/50 hover:bg-zinc-50/80' : 'hover:bg-zinc-50/50'}>
                <TableCell>
                  <div className="font-semibold text-zinc-900">{p.nome}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: p.categoria.cor }}
                      title={p.categoria.cor}
                    />
                    <span className="text-sm font-medium text-zinc-600">
                      {p.categoria.nome}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">
                      Loja: {p.qtdEstoque} <span className="text-zinc-400 font-normal">| Visor: {p.qtdVisor}</span>
                    </span>
                    {hasStockAlert && p.disponivel && (
                      <span className="text-[10px] font-bold text-red-600 uppercase mt-0.5">Estoque Baixo</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-zinc-900">{formatCurrency(p.preco)}</span>
                  {p.precoAnterior !== null && (
                    <div className="text-[10px] line-through text-zinc-400 mt-0.5" title={`Atualizado em ${p.precoAtualizadoEm ? new Date(p.precoAtualizadoEm).toLocaleDateString() : 'N/A'}`}>
                      {formatCurrency(p.precoAnterior)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {p.disponivel ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Disponível</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200">Indisponível</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(p)} className="cursor-pointer gap-2">
                        <Edit2 className="w-4 h-4 text-zinc-500" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(p.id, p.disponivel)} 
                        className="cursor-pointer gap-2"
                      >
                        {p.disponivel ? (
                          <><Ban className="w-4 h-4 text-red-500" /> Desativar</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 text-emerald-500" /> Reativar</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
