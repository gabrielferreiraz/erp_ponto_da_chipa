import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/with-security'
import { AuthService } from '@/services/auth.service'
import { getClientIP } from '@/lib/validations/common'
import { resetPasswordRequestSchema } from '@/lib/validations/auth'

const authService = new AuthService()

export const POST = withSecurity(async (req) => {
  const ip = getClientIP(req)
  const body = await req.json()
  
  const parsed = resetPasswordRequestSchema.safeParse(body)
  if (!parsed.success) {
    // R2: Mesmo com input inválido, poderíamos retornar 400 ou sucesso neutro.
    // Aqui retornamos 400 pois é erro de formato, não de existência.
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // R2: Endpoint para solicitar reset (sempre resposta neutra)
  await authService.requestPasswordReset(parsed.data.email, ip)
  
  return NextResponse.json({ 
    success: true, 
    message: 'Se o email existir, um link de recuperação será enviado.' 
  })
}, { 
  public: true,
  rateLimit: { limit: 3, windowMs: 15 * 60 * 1000 } // 3 solicitações a cada 15 min por IP
})
