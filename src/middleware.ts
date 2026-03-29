import { auth } from '@/lib/auth-instance'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Role = 'ADMIN' | 'CAIXA' | 'ATENDENTE'

const routePermissions: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  '/caixa': ['ADMIN', 'CAIXA'],
  '/atendente': ['ADMIN', 'ATENDENTE'],
}

export default auth(function middleware(req) {
  const { nextUrl, auth: session } = req as any
  const pathname = nextUrl.pathname

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth')

  if (isPublicRoute) {
    if (pathname.startsWith('/login') && session?.user) {
      return redirectByRole(session.user.role as Role, req)
    }
    return NextResponse.next()
  }

  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role as Role

  for (const [prefix, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(userRole)) {
        return redirectByRole(userRole, req)
      }
      break
    }
  }

  if (pathname === '/') {
    return redirectByRole(userRole, req)
  }

  return NextResponse.next()
})

function redirectByRole(role: Role, req: NextRequest): NextResponse {
  const roleRoutes: Record<Role, string> = {
    ADMIN: '/admin/dashboard',
    CAIXA: '/caixa/fila',
    ATENDENTE: '/atendente/pedidos',
  }
  return NextResponse.redirect(new URL(roleRoutes[role] ?? '/login', req.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)).*)',
  ],
}