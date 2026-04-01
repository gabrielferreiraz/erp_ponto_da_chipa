import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export class TokenService {
  /**
   * Gera um token de verificação de email (expira em 24h)
   */
  async generateVerificationToken(email: string) {
    const token = randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Remove tokens antigos para o mesmo email
    await prisma.verificationToken.deleteMany({
      where: { email }
    })

    const verificationToken = await prisma.verificationToken.create({
      data: {
        email,
        token, 
        expires,
      }
    })

    return verificationToken
  }

  /**
   * Valida um token de verificação de email
   */
  async verifyEmailToken(token: string) {
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!existingToken) return null
    if (new Date() > existingToken.expires) return null

    return existingToken
  }

  /**
   * Gera um token de reset de senha (expira em 1h)
   * O token enviado ao usuário é o bruto, o salvo no banco é o hash.
   */
  async generatePasswordResetToken(email: string) {
    const token = randomUUID()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    
    // Hash do token para salvar no banco (R5: Nunca salvar token bruto sensível)
    const hashedToken = await bcrypt.hash(token, 10)

    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expires,
      }
    })

    return token // Retorna o token bruto para ser enviado por email
  }

  /**
   * Valida um token de reset de senha
   */
  async verifyPasswordResetToken(email: string, rawToken: string) {
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email }
    })

    if (!existingToken) return null
    if (new Date() > existingToken.expires) return null

    const isValid = await bcrypt.compare(rawToken, existingToken.token)
    if (!isValid) return null

    return existingToken
  }

  /**
   * Remove tokens após o uso
   */
  async deletePasswordResetToken(id: string) {
    await prisma.passwordResetToken.delete({ where: { id } })
  }

  async deleteVerificationToken(id: string) {
    await prisma.verificationToken.delete({ where: { id } })
  }
}
