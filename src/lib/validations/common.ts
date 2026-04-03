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

// Regex para validar IPv4 e IPv6 básico
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/

// Helper para extrair IP da requisição.
// x-forwarded-for é controlável pelo cliente; usamos apenas se o formato parecer válido.
export function getClientIP(req: Request): string {
  try {
    if (!req || typeof req.headers?.get !== 'function') {
      return '127.0.0.1'
    }

    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
      const candidate = forwarded.split(',')[0].trim()
      // Valida formato antes de confiar
      if (IP_REGEX.test(candidate) && candidate.length <= 45) {
        return candidate
      }
    }

    // Fallback: real-ip header (Nginx/Cloudflare)
    const realIp = req.headers.get('x-real-ip')
    if (realIp && IP_REGEX.test(realIp.trim()) && realIp.trim().length <= 45) {
      return realIp.trim()
    }
  } catch (e) {
    console.error('Error getting client IP:', e)
  }
  return '127.0.0.1'
}
