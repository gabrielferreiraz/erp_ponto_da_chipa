import { z } from 'zod'

export const createProdutoSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  preco: z
    .number()
    .positive('Preço deve ser positivo')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  qtdEstoque: z.number().int().min(0).default(0),
  qtdVisor: z.number().int().min(0).default(0),
  estoqueMinimo: z.number().int().min(0).default(5),
  disponivel: z.boolean().default(true),
  imagemUrl: z.string().url('URL de imagem inválida').optional().nullable(),
})

export const updateProdutoSchema = createProdutoSchema.partial().extend({
  id: z.string().min(1, 'ID do produto inválido'),
})

export const createCategoriaSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome muito longo'),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (ex: #FF5733)')
    .default('#000000'),
  ordem: z.number().int().min(0).default(0),
})

export const updateCategoriaSchema = createCategoriaSchema.partial().extend({
  id: z.string().min(1, 'ID da categoria inválido'),
})

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>
export type UpdateProdutoInput = z.infer<typeof updateProdutoSchema>
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>
