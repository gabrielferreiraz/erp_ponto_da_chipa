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
      categoriaId: '',
      preco: 0,
      qtdEstoque: 0,
      qtdVisor: 0,
      estoqueMinimo: 5,
      disponivel: true,
      imagemUrl: ''
    }
  })

  // Helper para formatar moeda BRL (centavos primeiro)
  const formatCurrency = (value: number | string) => {
    const amount = typeof value === 'string' ? value.replace(/\D/g, '') : Math.round(Number(value) * 100).toString()
    if (!amount) return 'R$ 0,00'
    const numericValue = parseInt(amount, 10) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue)
  }

  // Helper para converter BRL formatado de volta para número
  const parseCurrency = (value: string) => {
    const amount = value.replace(/\D/g, '')
    return parseInt(amount, 10) / 100 || 0
  }

  // Sincroniza estado de edição quando o modal abrir
  useEffect(() => {
    if (open) {
      console.log('[DEBUG] Modal aberto. Produto para edição:', produto)
      if (produto) {
        setValue('nome', produto.nome)
        setValue('categoriaId', produto.categoriaId)
        setValue('preco', Number(produto.preco))
        setValue('qtdEstoque', Number(produto.qtdEstoque))
        setValue('qtdVisor', Number(produto.qtdVisor))
        setValue('estoqueMinimo', Number(produto.estoqueMinimo))
        setValue('disponivel', Boolean(produto.disponivel))
        setValue('imagemUrl', produto.imagemUrl || '')
      } else {
        reset({
          nome: '',
          categoriaId: '',
          preco: 0,
          qtdEstoque: 0,
          qtdVisor: 0,
          estoqueMinimo: 5,
          disponivel: true,
          imagemUrl: ''
        })
      }
    }
  }, [open, produto, setValue, reset])

  const onSubmit = async (data: FormData) => {
    console.log('[DEBUG] Dados validados pelo Zod:', data)
    try {
      const payload = {
        ...data,
        preco: Number(data.preco),
        qtdEstoque: Number(data.qtdEstoque),
        qtdVisor: Number(data.qtdVisor),
        estoqueMinimo: Number(data.estoqueMinimo),
        imagemUrl: data.imagemUrl === '' ? null : data.imagemUrl
      }
      
      console.log('[DEBUG] Enviando payload para API:', payload)

      const url = isEditing ? `/api/produtos/${produto.id}` : '/api/produtos'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const onError = (errors: any) => {
    console.error('[DEBUG] Erros de Validação do Formulário:', errors)
    // Log exactly which fields are failing and what the values are in the form state
    const formValues = control._formValues
    console.log('[DEBUG] Valores atuais no estado do formulário:', formValues)
    toast.error('Verifique os campos obrigatórios')
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

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="nome"
                render={({ field }) => (
                  <Input 
                    id="nome" 
                    {...field} 
                    placeholder="Ex: Chipa Tradicional" 
                  />
                )}
              />
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
              <Controller
                control={control}
                name="preco"
                render={({ field }) => (
                  <Input 
                    id="preco" 
                    placeholder="R$ 0,00"
                    value={formatCurrency(field.value)}
                    onChange={(e) => {
                      const numeric = parseCurrency(e.target.value)
                      field.onChange(numeric)
                    }}
                  />
                )}
              />
              {errors.preco && <p className="text-xs text-red-500">{errors.preco.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdEstoque">Loja</Label>
              <Input 
                id="qtdEstoque" 
                type="number" 
                {...register('qtdEstoque', { valueAsNumber: true })} 
              />
              {errors.qtdEstoque && <p className="text-xs text-red-500">{errors.qtdEstoque.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdVisor">Visor</Label>
              <Input 
                id="qtdVisor" 
                type="number" 
                {...register('qtdVisor', { valueAsNumber: true })} 
              />
              {errors.qtdVisor && <p className="text-xs text-red-500">{errors.qtdVisor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Min.</Label>
              <Input 
                id="estoqueMinimo" 
                type="number" 
                {...register('estoqueMinimo', { valueAsNumber: true })} 
              />
              {errors.estoqueMinimo && <p className="text-xs text-red-500">{errors.estoqueMinimo.message}</p>}
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
