import { prisma } from '@/lib/prisma'
import { createHmac, randomUUID } from 'crypto'

export class TokenService {
  private getTokenSecret() {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET não configurado')
    }
    return secret
  }

  private hashToken(token: string) {
    return createHmac('sha256', this.getTokenSecret()).update(token).digest('hex')
  }

  /**
   * Gera um token de verificação de email (expira em 24h)
   */
  async generateVerificationToken(email: string) {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const tokenHash = this.hashToken(token)

    // Remove tokens antigos para o mesmo email
    await prisma.verificationToken.deleteMany({
      where: { email }
    })

    await prisma.verificationToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      }
    })

    return token
  }

  /**
   * Valida um token de verificação de email
   */
  private async invalidateVerificationToken(id: string) {
    await prisma.verificationToken.deleteMany({ where: { id } })
  }

  private async invalidatePasswordResetToken(id: string) {
    await prisma.passwordResetToken.deleteMany({ where: { id } })
  }

  async consumeVerificationToken(token: string): Promise<{
    status: 'valid' | 'invalid' | 'expired'
    email?: string
  }> {
    const tokenHash = this.hashToken(token)
    const existingToken = await prisma.verificationToken.findUnique({ where: { tokenHash } })

    if (!existingToken) return { status: 'invalid' }

    if (new Date() > existingToken.expiresAt) {
      await this.invalidateVerificationToken(existingToken.id)
      return { status: 'expired' }
    }

    await this.invalidateVerificationToken(existingToken.id)
    return { status: 'valid', email: existingToken.email }
  }

  /**
   * Gera um token de reset de senha (expira em 1h)
   * O token enviado ao usuário é o bruto, o salvo no banco é o hash.
   */
  async generatePasswordResetToken(email: string) {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    const tokenHash = this.hashToken(token)

    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      }
    })

    return token // Retorna o token bruto para ser enviado por email
  }

  /**
   * Valida um token de reset de senha
   */
  async consumePasswordResetToken(rawToken: string): Promise<{
    status: 'valid' | 'invalid' | 'expired'
    email?: string
  }> {
    const tokenHash = this.hashToken(rawToken)
    const existingToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!existingToken) return { status: 'invalid' }

    if (new Date() > existingToken.expiresAt) {
      await this.invalidatePasswordResetToken(existingToken.id)
      return { status: 'expired' }
    }

    await this.invalidatePasswordResetToken(existingToken.id)
    return { status: 'valid', email: existingToken.email }
  }

  async deleteExpiredTokens() {
    const now = new Date()
    await prisma.verificationToken.deleteMany({ where: { expiresAt: { lt: now } } })
    await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } })
  }

  async deletePasswordResetToken(id: string) {
    await this.invalidatePasswordResetToken(id)
  }

  async deleteVerificationToken(id: string) {
    await this.invalidateVerificationToken(id)
  }
}
