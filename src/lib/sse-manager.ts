/**
 * SSEManager - Gerencia conexões ativas para evitar abuso.
 */
const globalSSE = global as typeof global & {
  activeConnections?: Map<string, number>
}

if (!globalSSE.activeConnections) {
  globalSSE.activeConnections = new Map()
}

export const sseManager = {
  /**
   * Adiciona uma conexão e retorna se é permitida.
   * Limite de 3 conexões simultâneas por IP/Sessão.
   */
  addConnection(key: string): boolean {
    const current = globalSSE.activeConnections!.get(key) || 0
    if (current >= 3) return false
    
    globalSSE.activeConnections!.set(key, current + 1)
    return true
  },

  removeConnection(key: string) {
    const current = globalSSE.activeConnections!.get(key) || 0
    if (current > 1) {
      globalSSE.activeConnections!.set(key, current - 1)
    } else {
      globalSSE.activeConnections!.delete(key)
    }
  }
}
