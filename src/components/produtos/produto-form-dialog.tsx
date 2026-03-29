'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useProdutos, ProdutoFrontend } from '@/hooks/use-produtos'
import { useCategorias } from '@/hooks/use-categorias'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProdutoSchema, CreateProdutoInput } from '@/lib/validations/produto'
import { Loader2 } from 'lucide-react'

type FormData = CreateProdutoInput

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: ProdutoFrontend | null
}

export function ProdutoFormDialog({ open, onOpenChange, produto }: Props) {
  const { mutate } = useProdutos()
  const { categorias, isLoading: loadingCats } = useCategorias()
  const isEditing = !!produto
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(createProdutoSchema) as any,
    defaultValues: {
      nome: '',
      preco: 0,
      qtdEstoque: 0,
      qtdVisor: 0,
      estoqueMinimo: 5,
      disponivel: true,
      imagemUrl: ''
    }
  })

  // Sincroniza estado de edição quando o modal abrir
  useEffect(() => {
    if (open) {
      if (produto) {
        setValue('nome', produto.nome)
        // Set explicitly to support object reference 
        setValue('categoriaId', produto.categoriaId)
        setValue('preco', produto.preco)
        setValue('qtdEstoque', produto.qtdEstoque)
        setValue('qtdVisor', produto.qtdVisor)
        setValue('estoqueMinimo', produto.estoqueMinimo)
        setValue('disponivel', produto.disponivel)
        setValue('imagemUrl', produto.imagemUrl || '')
      } else {
        reset()
      }
    }
  }, [open, produto, setValue, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEditing ? `/api/produtos/${produto.id}` : '/api/produtos'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Erro ao processar Produto')
      }

      toast.success(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`)
      mutate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atenção: A alteração de preço fica salva no histórico global.' 
              : 'Preencha os dados abaixo para adicionar um produto ao catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto <span className="text-red-500">*</span></Label>
              <Input id="nome" {...register('nome')} placeholder="Ex: Chipa Tradicional" />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoria <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="categoriaId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCats ? "Carregando..." : "Selecione..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor }} />
                            {c.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoriaId && <p className="text-xs text-red-500">{errors.categoriaId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) <span className="text-red-500">*</span></Label>
              <Input id="preco" type="number" step="0.01" {...register('preco', { valueAsNumber: true })} />
              {errors.preco && <p className="text-xs text-red-500">{errors.preco.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdEstoque">Loja</Label>
              <Input id="qtdEstoque" type="number" {...register('qtdEstoque', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdVisor">Visor</Label>
              <Input id="qtdVisor" type="number" {...register('qtdVisor', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Min.</Label>
              <Input id="estoqueMinimo" type="number" {...register('estoqueMinimo', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagemUrl">URL da Imagem (opcional)</Label>
            <Input id="imagemUrl" {...register('imagemUrl')} placeholder="https://..." />
            {errors.imagemUrl && <p className="text-xs text-red-500">{errors.imagemUrl.message}</p>}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Controller
              control={control}
              name="disponivel"
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="disponivel"
                  className="w-4 h-4 text-amber-500 rounded border-zinc-300 focus:ring-amber-500"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="disponivel" className="cursor-pointer">Produto Disponível para Venda</Label>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Salvar Edição' : 'Cadastrar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
