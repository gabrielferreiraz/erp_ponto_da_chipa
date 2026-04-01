import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { resetPasswordConfirmSchema } from '@/lib/validations/auth'
import { z } from 'zod'

const authService = new AuthService()

// Adicionando email ao schema de confirmação para validação robusta
const confirmSchema = resetPasswordConfirmSchema.extend({
  email: z.string().email()
})

export const POST = withSecurity(async (req) => {
  const ip = getClientIP(req)
  const body = await req.json()
  
  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: 'Dados inválidos', 
      details: parsed.error.flatten() 
    }, { status: 400 })
  }

  try {
    const { email, token, senha } = parsed.data
    await authService.confirmPasswordReset(email, token, senha, ip)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Senha alterada com sucesso.' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}, { 
  public: true,
  rateLimit: { limit: 5, windowMs: 15 * 60 * 1000 } // 5 tentativas de confirmação a cada 15 min
})
