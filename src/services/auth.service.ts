import { prisma } from '@/lib/prisma'
import { TokenService } from './token.service'
import { SecurityLogger } from '@/lib/security-logger'
import bcrypt from 'bcryptjs'

export class AuthService {
  private tokenService = new TokenService()

  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(email: string, ip: string) {
    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    // Resposta neutra mesmo se o usuário não existir (R2: Não revelar se email existe)
    if (!user || !user.ativo) {
      SecurityLogger.log({
        event: 'UNAUTHORIZED',
        route: '/api/auth/reset-password/request',
        ip,
        details: `Solicitação de reset para email inexistente ou inativo: ${email}`
      })
      return { success: true } 
    }

    const token = await this.tokenService.generatePasswordResetToken(email)

    // TODO: integrar com serviço de email (ex: Resend, SendGrid) para enviar o token.
    // Em desenvolvimento, loga o token no console para testes.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset token for ${email}: ${token}`)
    }

    SecurityLogger.log({
      event: 'LOGIN_SUCCESS',
      route: '/api/auth/reset-password/request',
      ip,
      userId: user.id,
      details: 'Token de reset de senha gerado'
    })

    return { success: true }
  }

  /**
   * Confirma reset de senha
   */
  async confirmPasswordReset(email: string, token: string, novaSenha: string, ip: string) {
    const existingToken = await this.tokenService.verifyPasswordResetToken(email, token)

    if (!existingToken) {
      SecurityLogger.log({
        event: 'UNAUTHORIZED',
        route: '/api/auth/reset-password/confirm',
        ip,
        details: 'Token de reset inválido ou expirado'
      })
      throw new Error('Token inválido ou expirado')
    }

    const user = await prisma.usuario.findUnique({
      where: { email: existingToken.email }
    })

    if (!user) throw new Error('Usuário não encontrado')

    const hashedSenha = await bcrypt.hash(novaSenha, 12)

    await prisma.usuario.update({
      where: { id: user.id },
      data: { senha: hashedSenha }
    })

    await this.tokenService.deletePasswordResetToken(existingToken.id)

    SecurityLogger.log({
      event: 'LOGIN_SUCCESS',
      route: '/api/auth/reset-password/confirm',
      ip,
      userId: user.id,
      details: 'Senha alterada com sucesso via reset'
    })

    return { success: true }
  }
}
