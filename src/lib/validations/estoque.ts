import * as z from 'zod'

export const estoqueReposicaoSchema = z.object({
  quantidade: z.number().int().positive('A quantidade deve ser maior que zero'),
})

export const estoqueEntradaSchema = z.object({
  quantidade: z.number().int().positive('A quantidade deve ser maior que zero'),
})

export const estoqueAjusteSchema = z.object({
  quantidade: z.number().int({ message: 'A quantidade deve ser um número inteiro' }),
  motivo: z.string().min(5, 'O motivo deve ter pelo menos 5 caracteres').max(200, 'Motivo muito longo'),
})

export const estoquePerdaSchema = z.object({
  quantidade: z.number().int().positive('A quantidade de perda deve ser maior que zero'),
  motivo: z.string().min(5, 'O motivo deve ter pelo menos 5 caracteres').max(200, 'Motivo muito longo'),
})
