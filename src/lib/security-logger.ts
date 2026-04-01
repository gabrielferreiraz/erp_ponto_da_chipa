/**
 * SecurityLogger - Auditoria mínima para eventos sensíveis.
 */
export class SecurityLogger {
  private static anonymizeIP(ip: string): string {
    if (!ip) return '0.0.0.0'
    // Anonimiza o último octeto para IPv4 ou última seção para IPv6
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0'
    }
    return ip.split(':').slice(0, 3).join(':') + ':xxxx'
  }

  static log(event: {
    event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMIT' | 'SERVER_ERROR'
    route: string
    userId?: string
    role?: string
    ip: string
    details?: string
  }) {
    const timestamp = new Date().toISOString()
    const safeIP = this.anonymizeIP(event.ip)
    
    const logEntry = {
      timestamp,
      ...event,
      ip: safeIP,
    }

    // Em produção, isso poderia ser enviado para um serviço de logs (Winston, Axiom, etc.)
    // Por enquanto, usaremos console.error para erros e console.log para o resto
    if (event.event === 'SERVER_ERROR' || event.event === 'LOGIN_FAILURE') {
      console.error(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`)
    } else {
      console.log(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`)
    }
  }
}
