import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth'

// Instância central do NextAuth — usada pelo middleware e server components
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
