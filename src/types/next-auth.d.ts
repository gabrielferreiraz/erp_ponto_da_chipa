import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    nome: string
    sessionVersion: number
  }

  interface Session {
    user: {
      id: string
      email?: string | null
      role: string
      nome: string
      sessionVersion: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    nome: string
    sessionVersion: number
  }
}
