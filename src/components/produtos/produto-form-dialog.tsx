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
import { cn } from '@/lib/utils'

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
      <DialogContent className={cn(
        // Layout: flex column, no default padding/gap
        'flex flex-col p-0 gap-0 overflow-hidden',
        // Height constraint for scroll
        'max-h-[92dvh]',
        // Desktop: centered dialog
        'sm:max-w-xl sm:rounded-xl',
        // Mobile: bottom sheet — override Radix centering
        'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0',
        'max-sm:translate-x-0 max-sm:translate-y-0',
        'max-sm:w-full max-sm:max-w-full',
        'max-sm:rounded-t-3xl max-sm:rounded-b-none',
      )}>
        {/* Handle bar — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-zinc-200 rounded-full" />
        </div>

        {/* Header — fixed at top */}
        <DialogHeader className="px-6 pt-4 pb-0 shrink-0">
          <DialogTitle className="text-base font-black tracking-tight text-zinc-900">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-zinc-500 font-medium pt-0.5">
            {isEditing
              ? 'Atenção: A alteração de preço fica salva no histórico global.'
              : 'Preencha os dados abaixo para adicionar um produto ao catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* ── SEÇÃO 1: Identidade & Comercial ── */}
            <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identidade & Preço</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-[12px] font-bold text-zinc-600">Nome do Produto <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="nome"
                    render={({ field }) => (
                      <Input
                        id="nome"
                        {...field}
                        className="h-11 bg-white border-zinc-200 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 shadow-sm"
                        placeholder="Ex: Chipa Tradicional"
                      />
                    )}
                  />
                  {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="categoriaId" className="text-[12px] font-bold text-zinc-600">Categoria <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="categoriaId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger className="h-11 bg-white border-zinc-200 focus:ring-zinc-900 shadow-sm">
                          <SelectValue placeholder={loadingCats ? "Carregando..." : "Selecione..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.cor }} />
                                <span className="font-medium text-zinc-700">{c.nome}</span>
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

              <div className="w-full sm:w-1/2">
                <div className="space-y-1.5">
                  <Label htmlFor="preco" className="text-[12px] font-bold text-zinc-600">Preço Venda (R$) <span className="text-red-500">*</span></Label>
                  <Controller
                    control={control}
                    name="preco"
                    render={({ field }) => (
                      <Input
                        id="preco"
                        className="h-11 bg-white border-zinc-200 text-lg font-black focus-visible:ring-zinc-900 shadow-sm tabular-nums text-zinc-900"
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
              </div>
            </div>

            {/* ── SEÇÃO 2: Movimentação de Estoque ── */}
            <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saldos de Estoque</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qtdEstoque" className="text-[12px] font-bold text-zinc-600">Depósito</Label>
                  <Input
                    id="qtdEstoque"
                    type="number"
                    className="h-11 bg-white shadow-sm font-black text-zinc-700 text-center"
                    {...register('qtdEstoque', { valueAsNumber: true })}
                  />
                  {errors.qtdEstoque && <p className="text-xs text-red-500">{errors.qtdEstoque.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qtdVisor" className="text-[12px] font-bold text-zinc-600">Visor</Label>
                  <Input
                    id="qtdVisor"
                    type="number"
                    className="h-11 bg-white shadow-sm font-black text-zinc-700 text-center border-blue-200"
                    {...register('qtdVisor', { valueAsNumber: true })}
                  />
                  {errors.qtdVisor && <p className="text-xs text-red-500">{errors.qtdVisor.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estoqueMinimo" className="text-[12px] font-bold text-zinc-600">Mínimo</Label>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    className="h-11 bg-white shadow-sm font-black text-zinc-400 text-center border-zinc-200"
                    {...register('estoqueMinimo', { valueAsNumber: true })}
                  />
                  {errors.estoqueMinimo && <p className="text-xs text-red-500">{errors.estoqueMinimo.message}</p>}
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 3: Apresentação & Mídia ── */}
            <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Publicação</h3>

              <div className="space-y-1.5">
                <Label htmlFor="imagemUrl" className="text-[12px] font-bold text-zinc-600">URL da Imagem (opcional)</Label>
                <Controller
                  control={control}
                  name="imagemUrl"
                  render={({ field }) => (
                    <div className="flex gap-3 items-start">
                      <Input
                        id="imagemUrl"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="https://..."
                        className="flex-1 h-11 bg-white shadow-sm"
                      />
                      {field.value && (
                        <img
                          src={field.value}
                          alt="prévia"
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-zinc-200 shadow-sm"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                  )}
                />
                {errors.imagemUrl && <p className="text-xs text-red-500">{errors.imagemUrl.message}</p>}
              </div>

              <div>
                <Controller
                  control={control}
                  name="disponivel"
                  render={({ field }) => (
                    <Label className="flex items-center cursor-pointer gap-3 w-max">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className="block h-7 w-[52px] rounded-full bg-zinc-200 peer-checked:bg-emerald-500 transition-colors shadow-inner border border-zinc-200/50 peer-checked:border-emerald-600/50" />
                        <div className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-[26px]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-zinc-800 leading-none">Produto Disponível</p>
                        <p className="text-[11px] text-zinc-400 font-medium">Permite exibir ao caixa e efetuar vendas.</p>
                      </div>
                    </Label>
                  )}
                />
              </div>
            </div>

          </div>{/* end scrollable body */}

          {/* ── BOTÕES — fixed at bottom ── */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-white shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-12 rounded-2xl px-6 font-bold text-zinc-500"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-2xl px-8 bg-zinc-900 hover:bg-zinc-800 active:scale-95 transition-all text-white min-w-[140px] font-bold tracking-wide"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Salvar Edição' : 'Cadastrar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
