import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { verifyEmailConfirmSchema } from '@/lib/validations/auth'

const authService = new AuthService()
const genericError = { error: 'Token inválido ou expirado' }

export async function GET(req: Request) {
  const ip = getClientIP(req)

  try {
    const url = new URL(req.url)
    const parsed = verifyEmailConfirmSchema.safeParse({ token: url.searchParams.get('token') })
    if (!parsed.success) {
      return NextResponse.json(genericError, { status: 400 })
    }

    await authService.verifyEmail(parsed.data.token, ip)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(genericError, { status: 400 })
  }
}

export async function POST(req: Request) {
  const ip = getClientIP(req)

  try {
    const body = await req.json()
    const parsed = verifyEmailConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(genericError, { status: 400 })
    }

    await authService.verifyEmail(parsed.data.token, ip)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(genericError, { status: 400 })
  }
}
