'use client'

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useProdutos, ProdutoFrontend, ProdutoFilters } from '@/hooks/use-produtos'
import { Loader2, Edit2, Ban, CheckCircle, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

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
    <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto no-scrollbar shadow-sm">
      <div className="min-w-[800px]">
        <Table>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque / Visor</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[80px] sm:w-[160px] text-right sticky right-0 bg-zinc-50 z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-zinc-100">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((p) => {
            const hasStockAlert = p.qtdEstoque + p.qtdVisor <= p.estoqueMinimo
            
            return (
              <TableRow key={p.id} className={cn('group', !p.disponivel ? 'opacity-60 bg-zinc-50/50 hover:bg-zinc-50/80' : 'hover:bg-zinc-50/50')}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.imagemUrl ? (
                      <img
                        src={p.imagemUrl}
                        alt={p.nome}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-zinc-300 uppercase">foto</span>
                      </div>
                    )}
                    <div className="font-semibold text-zinc-900">{p.nome}</div>
                  </div>
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
                <TableCell className="sticky right-0 bg-white group-hover:bg-zinc-50/50 z-10 border-l border-zinc-100 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] text-right px-4 transition-colors">
                  {/* Desktop Actions */}
                  <div className="hidden sm:flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(p)}
                      title="Editar produto"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-all hover:scale-110 active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(p.id, p.disponivel)}
                      title={p.disponivel ? 'Desativar produto' : 'Reativar produto'}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${
                        p.disponivel
                          ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {p.disponivel ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Mobile Dropdown Sandwich Menu */}
                  <div className="sm:hidden flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all active:scale-95">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-zinc-100">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Opções</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-100" />
                        <DropdownMenuItem onClick={() => onEdit(p)} className="flex items-center gap-3 cursor-pointer rounded-xl font-bold text-zinc-700 py-3 focus:bg-zinc-100 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center"><Edit2 className="w-3.5 h-3.5 text-zinc-600" /></div>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(p.id, p.disponivel)} className={`flex items-center gap-3 cursor-pointer rounded-xl font-bold py-3 transition-colors ${p.disponivel ? 'text-rose-600 focus:bg-rose-50' : 'text-emerald-700 focus:bg-emerald-50'}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.disponivel ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                            {p.disponivel ? <Ban className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          {p.disponivel ? 'Desativar' : 'Reativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
