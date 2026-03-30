import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { resetPasswordConfirmSchema } from '@/lib/validations/auth'

const authService = new AuthService()
const genericError = { error: 'Token inválido ou expirado' }

export async function POST(req: Request) {
  const ip = getClientIP(req)

  try {
    const body = await req.json()
    const parsed = resetPasswordConfirmSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    await authService.confirmPasswordReset(parsed.data.token, parsed.data.senha, ip)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(genericError, { status: 400 })
  }
}
