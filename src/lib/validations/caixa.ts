import * as z from 'zod'

export const pagamentoSchema = z.object({
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO']),
  idempotencyKey: z.string().min(5),
})

export const cancelarItemSchema = z.object({
  quantidadeCancelada: z.number().int().positive().optional(),
  motivoCancelamento: z.string().min(5, 'O motivo deve ter pelo menos 5 caracteres').max(150, 'Motivo muito longo'),
})
