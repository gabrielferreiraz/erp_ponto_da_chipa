import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export class TokenService {
  /**
   * Gera um token de reset de senha (expira em 1h)
   * O token enviado ao usuário é o bruto, o salvo no banco é o hash.
   */
  async generatePasswordResetToken(email: string) {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    
    // Hash do token para salvar no banco (R5: Nunca salvar token bruto sensível)
    const tokenHash = await bcrypt.hash(token, 10)

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
  async verifyPasswordResetToken(email: string, rawToken: string) {
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email }
    })

    if (!existingToken) return null
    if (new Date() > existingToken.expiresAt) return null

    const isValid = await bcrypt.compare(rawToken, existingToken.tokenHash)
    if (!isValid) return null

    return existingToken
  }

  /**
   * Remove tokens após o uso
   */
  async deletePasswordResetToken(id: string) {
    await prisma.passwordResetToken.delete({ where: { id } })
  }
}
