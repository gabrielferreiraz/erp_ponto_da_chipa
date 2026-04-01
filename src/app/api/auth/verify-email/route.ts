import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { z } from 'zod'

const authService = new AuthService()

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
})

export const POST = withSecurity(async (req) => {
  const ip = getClientIP(req)
  const body = await req.json()
  
  const parsed = verifyEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  try {
    await authService.verifyEmail(parsed.data.token, ip)
    return NextResponse.json({ success: true, message: 'Email verificado com sucesso' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}, { 
  public: true,
  rateLimit: { limit: 10, windowMs: 15 * 60 * 1000 } // 10 tentativas a cada 15 min
})
