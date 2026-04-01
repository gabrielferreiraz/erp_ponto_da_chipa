'use client'

import { useEffect, useCallback } from 'react'
import { mutate as globalMutate } from 'swr'

/**
 * Singleton de EventSource para evitar múltiplas conexões na mesma aba.
 */
let sharedEventSource: EventSource | null = null
let connectionCount = 0
let retryDelay = 1000

export function useSSE(onMessage?: (event: string) => void) {
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    if (!sharedEventSource || sharedEventSource.readyState === EventSource.CLOSED) {
      sharedEventSource = new EventSource('/api/eventos')

      sharedEventSource.onopen = () => {
        retryDelay = 1000
        console.log('[SSE] Conectado com sucesso')
      }

      sharedEventSource.onerror = () => {
        console.error('[SSE] Erro na conexão, tentando reconectar...')
        if (sharedEventSource) sharedEventSource.close()
        
        setTimeout(() => connect(), retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30000)
      }

      // Handlers globais que todas as telas precisam
      sharedEventSource.addEventListener('novo_pedido', () => {
        // Pequeno delay para garantir que o banco já persistiu se o evento for muito rápido
        setTimeout(() => {
          globalMutate('/api/pedidos')
          globalMutate('/api/caixa/fila')
        }, 100)
      })

      sharedEventSource.addEventListener('pedido_pago', () => {
        setTimeout(() => {
          globalMutate('/api/pedidos')
          globalMutate('/api/caixa/fila')
          globalMutate('/api/estoque')
        }, 100)
      })
    }

    return sharedEventSource
  }, [])

  useEffect(() => {
    const es = connect()
    connectionCount++

    const customHandler = (e: MessageEvent) => {
      if (onMessage) onMessage(e.type)
    }

    if (es && onMessage) {
      es.addEventListener('novo_pedido', () => onMessage('novo_pedido'))
      es.addEventListener('pedido_pago', () => onMessage('pedido_pago'))
    }

    return () => {
      connectionCount--
      if (connectionCount <= 0 && sharedEventSource) {
        sharedEventSource.close()
        sharedEventSource = null
      }
    }
  }, [connect, onMessage])
}
