import * as z from 'zod'

export const pagamentoSchema = z.object({
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO']),
  idempotencyKey: z.string().min(5),
})

export const cancelarItemSchema = z.object({
  itemId: z.string().min(1),
  quantidadeCancelada: z.number().int().positive().optional(),
  motivoCancelamento: z.string().min(3, 'O motivo deve ter pelo menos 3 caracteres').max(150, 'Motivo muito longo').optional().default('Ajuste no Caixa'),
})

export const adicionarItemSchema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.number().int().positive(),
})
