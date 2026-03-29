'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useCategorias, CategoriaWithCount } from '@/hooks/use-categorias'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCategoriaSchema, CreateCategoriaInput } from '@/lib/validations/produto'
import { Loader2 } from 'lucide-react'

type FormData = CreateCategoriaInput

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: CategoriaWithCount | null
}

export function CategoriaFormDialog({ open, onOpenChange, categoria }: Props) {
  const { mutate } = useCategorias()
  const isEditing = !!categoria
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(createCategoriaSchema) as any,
    defaultValues: {
      nome: '',
      cor: '#000000',
      ordem: 0
    }
  })

  // Sincroniza estado de edição quando o modal abrir
  useEffect(() => {
    if (open) {
      if (categoria) {
        setValue('nome', categoria.nome)
        // input color value requires full hex #xxxxxx
        setValue('cor', categoria.cor)
        setValue('ordem', categoria.ordem)
      } else {
        reset()
      }
    }
  }, [open, categoria, setValue, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEditing ? `/api/categorias/${categoria.id}` : '/api/categorias'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Erro ao processar')
      }

      toast.success(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`)
      mutate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Altere os detalhes da categoria selecionada.' 
              : 'Preencha os dados abaixo para cadastrar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: Bebidas" autoFocus />
            {errors.nome && <p className="text-xs text-red-500 font-medium">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cor">Cor (Identidade Visual) <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input 
                  id="cor" 
                  type="color" 
                  className="w-14 h-10 p-1 cursor-pointer rounded-md" 
                  {...register('cor')} 
                />
                <Input type="text" {...register('cor')} placeholder="#Hex" className="flex-1 font-mono uppercase" />
              </div>
              {errors.cor && <p className="text-xs text-red-500 font-medium">{errors.cor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de Exibição <span className="text-red-500">*</span></Label>
              <Input id="ordem" type="number" {...register('ordem', { valueAsNumber: true })} min={0} />
              {errors.ordem && <p className="text-xs text-red-500 font-medium">{errors.ordem.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-amber-500 hover:bg-amber-600 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isEditing ? 'Salvar' : 'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
