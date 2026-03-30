import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'ADMIN' | 'CAIXA' | 'ATENDENTE'
    nome: string
    sessionVersion: number
  }

  interface Session {
    user: {
      id: string
      email: string
      role: 'ADMIN' | 'CAIXA' | 'ATENDENTE'
      nome: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'CAIXA' | 'ATENDENTE'
    nome: string
    sessionVersion: number
  }
}
