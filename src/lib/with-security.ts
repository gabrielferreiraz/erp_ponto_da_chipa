import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-instance'
import { rateLimiter } from '@/lib/rate-limiter'
import { SecurityLogger } from '@/lib/security-logger'
import { getClientIP } from '@/lib/validations/common'

/**
 * Opções para o wrapper de segurança
 */
interface SecurityOptions {
  roles?: ('ADMIN' | 'CAIXA' | 'ATENDENTE')[]
  public?: boolean
  rateLimit?: {
    limit: number
    windowMs: number
  }
}

/**
 * Contexto original do Next.js (req, { params })
 */
interface NextContext {
  params: any
}

/**
 * HOC para envolver Route Handlers com Rate Limit, Logging e Auth
 */
export function withSecurity(
  handler: (req: Request, session: any, context: NextContext) => Promise<Response>,
  options: SecurityOptions = {}
) {
  return async (req: Request, context: NextContext) => {
    const ip = getClientIP(req)
    const route = new URL(req.url).pathname

    // 1. Rate Limit
    if (options.rateLimit) {
      const isLimited = await rateLimiter.isLimited(
        `${ip}:${route}`,
        options.rateLimit.limit,
        options.rateLimit.windowMs
      )

      if (isLimited) {
        SecurityLogger.log({
          event: 'RATE_LIMIT',
          route,
          ip,
          details: 'Muitas requisições em pouco tempo'
        })
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente mais tarde.' },
          { status: 429 }
        )
      }
    }

    // 2. Autenticação e Autorização (se não for público)
    let session = null
    if (!options.public) {
      session = await auth()
      
      if (!session?.user) {
        SecurityLogger.log({ event: 'UNAUTHORIZED', route, ip })
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }

      if (options.roles && !options.roles.includes(session.user.role as any)) {
        SecurityLogger.log({ 
          event: 'FORBIDDEN', 
          route, 
          ip, 
          userId: session.user.id, 
          role: session.user.role 
        })
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
      }
    }

    // 3. Execução do Handler com Try/Catch para Auditoria de 5xx
    try {
      return await handler(req, session, context)
    } catch (error: any) {
      SecurityLogger.log({
        event: 'SERVER_ERROR',
        route,
        ip,
        userId: session?.user?.id,
        details: error.message
      })
      // Nunca expor stack trace
      return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
    }
  }
}
