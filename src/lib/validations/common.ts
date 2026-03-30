import { z } from 'zod'

/**
 * Schemas Zod padronizados para Hardening de Inputs
 */

export const commonParams = {
  // IDs baseados em CUID ou UUID
  id: z.string().min(1).max(128),
  
  // Paginação segura
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Filtros de tempo comuns
  periodo: z.enum(['hoje', '7dias', '30dias', 'total']).default('hoje'),
}

// Helper para extrair IP da requisição
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
