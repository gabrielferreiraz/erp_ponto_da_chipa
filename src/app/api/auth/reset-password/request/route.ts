import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { resetPasswordRequestSchema } from '@/lib/validations/auth'

const authService = new AuthService()

export async function POST(req: Request) {
  const ip = getClientIP(req)

  try {
    const body = await req.json()
    const parsed = resetPasswordRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    await authService.requestPasswordReset(parsed.data.email, ip)
    return NextResponse.json({
      success: true,
      message: 'Se a conta existir, enviaremos as instruções para reset de senha.',
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
