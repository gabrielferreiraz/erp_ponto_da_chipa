/**
 * RateLimiter - Estratégia simples em memória por IP + Rota.
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const globalRateLimit = global as typeof global & {
  rateLimits?: Map<string, RateLimitEntry>
}

if (!globalRateLimit.rateLimits) {
  globalRateLimit.rateLimits = new Map()
}

export const rateLimiter = {
  /**
   * Verifica se o limite foi excedido.
   * @param key Identificador único (ex: ip + route)
   * @param limit Máximo de requisições na janela
   * @param windowMs Janela de tempo em milissegundos
   */
  async isLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now()
    const entry = globalRateLimit.rateLimits!.get(key)

    if (!entry || now > entry.resetTime) {
      globalRateLimit.rateLimits!.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return false
    }

    entry.count++
    return entry.count > limit
  }
}

// Limpeza periódica para evitar vazamento de memória (a cada 10 minutos)
setInterval(() => {
  const now = Date.now()
  globalRateLimit.rateLimits?.forEach((entry, key) => {
    if (now > entry.resetTime) {
      globalRateLimit.rateLimits?.delete(key)
    }
  })
}, 600000)
