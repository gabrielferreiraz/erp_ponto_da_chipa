import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import { rateLimiter } from '@/lib/rate-limiter'
import { SecurityLogger } from '@/lib/security-logger'
import { getClientIP } from '@/lib/validations/common'

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
        const ip = getClientIP(req as any)
        const route = '/api/auth/login'

        // Rate Limit no Login (máx 5 tentativas por 15 minutos por IP)
        const isLimited = await rateLimiter.isLimited(`${ip}:${route}`, 5, 15 * 60 * 1000)
        if (isLimited) {
          SecurityLogger.log({ event: 'RATE_LIMIT', route, ip, details: 'Muitas tentativas de login' })
          throw new Error('Muitas tentativas. Aguarde 15 minutos.')
        }

        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, details: 'Formato de credenciais inválido' })
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
          emailVerified: true,
          sessionVersion: true,
        },
      })

        if (!usuario) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, details: `Usuário não encontrado: ${email}` })
          return null
        }

        if (!usuario.ativo) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, userId: usuario.id, details: 'Usuário inativo' })
          return null
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, userId: usuario.id, details: 'Senha incorreta' })
          return null
        }

        SecurityLogger.log({ 
          event: 'LOGIN_SUCCESS', 
          route, 
          ip, 
          userId: usuario.id, 
          role: usuario.role 
        })

        return {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          sessionVersion: usuario.sessionVersion,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Adiciona role, id, nome e sessionVersion ao token JWT na primeira autenticação
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.nome = user.nome
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      // R3: Role SEMPRE vem do token, nunca do body
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'CAIXA' | 'ATENDENTE'
        session.user.nome = token.nome as string
        session.user.sessionVersion = token.sessionVersion
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
