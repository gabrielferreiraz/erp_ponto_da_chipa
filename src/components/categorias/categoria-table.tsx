'use client'

import { useCategorias, CategoriaWithCount } from '@/hooks/use-categorias'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  onEdit: (categoria: CategoriaWithCount) => void
}

export function CategoriaTable({ onEdit }: Props) {
  const { categorias, isLoading, isError, mutate } = useCategorias()

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao deletar categoria')
      }
      toast.success('Categoria deletada com sucesso!')
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
      <div className="text-center p-8 text-red-500 bg-white rounded-xl border border-zinc-200">
        Erro ao carregar categorias.
      </div>
    )
  }

  if (categorias.length === 0) {
    return (
      <div className="text-center p-12 text-zinc-500 bg-white rounded-xl border border-zinc-200">
        Nenhuma categoria encontrada.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            <TableHead className="w-16 text-center">Cor</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="text-center">Ordem</TableHead>
            <TableHead className="text-center">Produtos</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorias.map((categoria) => {
            const hasProdutos = categoria._count.produtos > 0

            return (
              <TableRow key={categoria.id} className="hover:bg-zinc-50/50">
                <TableCell className="text-center flex justify-center py-4">
                  <div
                    className="w-6 h-6 rounded-full border border-zinc-300 shadow-sm"
                    style={{ backgroundColor: categoria.cor }}
                    title={categoria.cor}
                  />
                </TableCell>
                <TableCell className="font-medium text-zinc-800">{categoria.nome}</TableCell>
                <TableCell className="text-center text-zinc-600">{categoria.ordem}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold border border-zinc-200">
                    {categoria._count.produtos}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(categoria)}
                            className="text-zinc-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar categoria</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={hasProdutos ? 'cursor-not-allowed inline-block' : 'inline-block'}>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={hasProdutos}
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja deletar a categoria "${categoria.nome}"?`)) {
                                  handleDelete(categoria.id)
                                }
                              }}
                              className="text-zinc-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className={hasProdutos ? 'bg-red-50 text-red-600 border border-red-200' : ''}>
                          {hasProdutos 
                            ? 'Bloqueado: Esta categoria possui produtos.' 
                            : 'Deletar categoria'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
