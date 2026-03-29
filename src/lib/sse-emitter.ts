import { EventEmitter } from 'events'

// Aumenta o limite padrão de listeners pra evitar memory leak warning no Node durante hot reload pesado/muitas telas.
const globalEmitter = global as typeof global & {
  sseEmitter?: EventEmitter
}

if (!globalEmitter.sseEmitter) {
  globalEmitter.sseEmitter = new EventEmitter()
  globalEmitter.sseEmitter.setMaxListeners(0) // ∞ listeners, ideal p/ ambiente interno sem escala web gigante
}

export const sseEmitter = globalEmitter.sseEmitter
