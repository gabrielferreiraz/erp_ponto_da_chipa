import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { verifyEmailRequestSchema } from '@/lib/validations/auth'

const authService = new AuthService()

export async function POST(req: Request) {
  const ip = getClientIP(req)

  try {
    const body = await req.json()
    const parsed = verifyEmailRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    await authService.requestEmailVerification(parsed.data.email, ip)
    return NextResponse.json({
      success: true,
      message: 'Se existir uma conta elegível, enviaremos as instruções por email.',
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
