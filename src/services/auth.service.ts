import { prisma } from '@/lib/prisma'
import { TokenService } from './token.service'
import { SecurityLogger } from '@/lib/security-logger'
import { EmailService } from './email.service'
import bcrypt from 'bcryptjs'

export class AuthService {
  private tokenService = new TokenService()
  private emailService = new EmailService()
  private readonly verificationRoute = '/api/auth/verify-email'
  private readonly passwordResetRoute = '/api/auth/reset-password'

  /**
   * Solicita envio de verificação de email sem revelar existência de conta
   */
  async requestEmailVerification(email: string, ip: string) {
    const user = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, ativo: true, emailVerified: true },
    })

    if (user && user.ativo && !user.emailVerified) {
      const token = await this.tokenService.generateVerificationToken(user.email)
      await this.emailService.sendVerificationEmail(user.email, token)
      SecurityLogger.log({
        event: 'EMAIL_VERIFICATION_SENT',
        route: `${this.verificationRoute}/request`,
        ip,
        userId: user.id,
      })
    }

    return { success: true }
  }

  /**
   * Processa a verificação de email via token
   */
  async verifyEmail(token: string, ip: string) {
    const consumedToken = await this.tokenService.consumeVerificationToken(token)

    if (consumedToken.status === 'invalid') {
      SecurityLogger.log({
        event: 'TOKEN_INVALID',
        route: `${this.verificationRoute}/confirm`,
        ip,
        details: 'Token de verificação inválido',
      })
      throw new Error('Token inválido ou expirado')
    }

    if (consumedToken.status === 'expired') {
      SecurityLogger.log({
        event: 'TOKEN_EXPIRED',
        route: `${this.verificationRoute}/confirm`,
        ip,
        details: 'Token de verificação expirado',
      })
      throw new Error('Token inválido ou expirado')
    }

    const user = await prisma.usuario.findUnique({
      where: { email: consumedToken.email },
      select: { id: true, emailVerified: true },
    })

    if (!user) {
      throw new Error('Token inválido ou expirado')
    }

    if (!user.emailVerified) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    }

    SecurityLogger.log({
      event: 'EMAIL_VERIFICATION_COMPLETED',
      route: `${this.verificationRoute}/confirm`,
      ip,
      userId: user.id,
      details: 'Email verificado com sucesso',
    })

    return { success: true }
  }

  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(email: string, ip: string) {
    const user = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, ativo: true },
    })

    // Resposta neutra mesmo se o usuário não existir (R2: Não revelar se email existe)
    if (user?.ativo) {
      const token = await this.tokenService.generatePasswordResetToken(user.email)
      await this.emailService.sendPasswordResetEmail(user.email, token)
      SecurityLogger.log({
        event: 'PASSWORD_RESET_REQUESTED',
        route: `${this.passwordResetRoute}/request`,
        ip,
        userId: user.id,
      })
    }

    return { success: true }
  }

  /**
   * Confirma reset de senha
   */
  async confirmPasswordReset(token: string, novaSenha: string, ip: string) {
    const consumedToken = await this.tokenService.consumePasswordResetToken(token)

    if (consumedToken.status === 'invalid') {
      SecurityLogger.log({
        event: 'TOKEN_INVALID',
        route: `${this.passwordResetRoute}/confirm`,
        ip,
        details: 'Token de reset inválido',
      })
      throw new Error('Token inválido ou expirado')
    }

    if (consumedToken.status === 'expired') {
      SecurityLogger.log({
        event: 'TOKEN_EXPIRED',
        route: `${this.passwordResetRoute}/confirm`,
        ip,
        details: 'Token de reset expirado',
      })
      throw new Error('Token inválido ou expirado')
    }

    const user = await prisma.usuario.findUnique({
      where: { email: consumedToken.email },
      select: { id: true, ativo: true },
    })

    if (!user || !user.ativo) throw new Error('Token inválido ou expirado')
    const hashedSenha = await bcrypt.hash(novaSenha, 12)

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        senha: hashedSenha,
        sessionVersion: { increment: 1 },
      },
    })

    SecurityLogger.log({
      event: 'PASSWORD_RESET_COMPLETED',
      route: `${this.passwordResetRoute}/confirm`,
      ip,
      userId: user.id,
      details: 'Senha alterada com sucesso via reset',
    })

    return { success: true }
  }
}
