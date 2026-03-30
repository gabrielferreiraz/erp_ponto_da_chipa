import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

type Role = 'ADMIN' | 'CAIXA' | 'ATENDENTE'

const routePermissions: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  '/caixa': ['ADMIN', 'CAIXA'],
  '/atendente': ['ADMIN', 'ATENDENTE'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth')

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // Garante que o getToken use o mesmo nome de cookie definido no auth.ts
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token',
  })

  if (isPublicRoute) {
    if (pathname.startsWith('/login') && token) {
      return redirectByRole(token.role as Role, request)
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = token.role as Role

  for (const [prefix, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(userRole)) {
        return redirectByRole(userRole, request)
      }
      break
    }
  }

  if (pathname === '/') {
    return redirectByRole(userRole, request)
  }

  return NextResponse.next()
}

function redirectByRole(role: Role, request: NextRequest): NextResponse {
  const roleRoutes: Record<Role, string> = {
    ADMIN: '/admin/dashboard',
    CAIXA: '/caixa/fila',
    ATENDENTE: '/atendente/pedidos',
  }
  return NextResponse.redirect(
    new URL(roleRoutes[role] ?? '/login', request.url)
  )
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)).*)',
  ],
}
