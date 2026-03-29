import * as z from 'zod'

export const itemPedidoSchema = z.object({
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  quantidade: z.number().int('Quantidade deve ser inteira').min(1, 'A quantidade mínima é 1'),
})

export const createPedidoSchema = z.object({
  tipo: z.enum(['LOCAL', 'VIAGEM']),
  mesaId: z.string().optional().nullable(),
  observacao: z.string().max(200, 'A observação deve ter no máximo 200 caracteres').optional().nullable(),
  itens: z.array(itemPedidoSchema).min(1, 'Adicione pelo menos um item ao pedido'),
})

export const updatePedidoSchema = createPedidoSchema.partial()
