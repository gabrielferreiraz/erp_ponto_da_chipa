import type { NextAuthConfig, User } from 'next-auth'
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
        const ip =
          req && typeof req === 'object' && 'headers' in req
            ? getClientIP(req as unknown as Request)
            : '127.0.0.1'
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

        const usuario = (await prisma.usuario.findUnique({
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
          } as any,
        })) as any

        if (!usuario) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, details: 'Credenciais inválidas' })
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

        if (!usuario.emailVerified) {
          SecurityLogger.log({ event: 'LOGIN_FAILURE', route, ip, userId: usuario.id, details: 'Credenciais inválidas' })
          return null
        }

        SecurityLogger.log({ 
          event: 'LOGIN_SUCCESS', 
          route, 
          ip, 
          userId: usuario.id, 
          role: usuario.role 
        })

        const authUser: User = {
          id: String(usuario.id),
          nome: String(usuario.nome),
          email: String(usuario.email),
          role: String(usuario.role),
          sessionVersion: Number(usuario.sessionVersion),
        }

        return authUser
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Adiciona role, id e nome ao token JWT na primeira autenticação
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nome = user.nome
        token.sessionVersion = user.sessionVersion
      }

      if (token.id) {
        const dbUser = (await prisma.usuario.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            nome: true,
            role: true,
            ativo: true,
            emailVerified: true,
            sessionVersion: true,
          } as any,
        })) as any

        if (
          !dbUser ||
          !dbUser.ativo ||
          !dbUser.emailVerified ||
          dbUser.sessionVersion !== token.sessionVersion
        ) {
          token.id = ''
          token.role = ''
          token.nome = ''
          token.sessionVersion = 0
          return token
        }

        token.nome = dbUser.nome
        token.role = dbUser.role
        token.sessionVersion = dbUser.sessionVersion
      }

      return token
    },
    async session({ session, token }) {
      // R3: Role SEMPRE vem do token, nunca do body
      if (token?.id && token?.role && token?.nome) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.nome = token.nome as string
        session.user.sessionVersion = token.sessionVersion as number
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
    updateAge: 15 * 60,
  },

  jwt: {
    maxAge: 8 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  trustHost: true,
}
