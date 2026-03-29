import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          // Zod falhou em silêncio
          return null
        }

        const { email, senha } = parsed.data

        const usuario = await prisma.usuario.findUnique({
          where: { email },
          select: {
            id: true,
            nome: true,
            email: true,
            senha: true,
            role: true,
            ativo: true,
          },
        })

        if (!usuario) {
          return null
        }

        if (!usuario.ativo) {
          return null
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Adiciona role, id e nome ao token JWT na primeira autenticação
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.nome = user.nome
      }
      return token
    },
    async session({ session, token }) {
      // R3: Role SEMPRE vem do token, nunca do body
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'CAIXA' | 'ATENDENTE'
        session.user.nome = token.nome as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (duração de um turno)
  },

  trustHost: true,
}
