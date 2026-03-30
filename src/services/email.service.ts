type EmailPayload = {
  to: string
  subject: string
  text: string
}

export class EmailService {
  private getBaseUrl() {
    return process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000'
  }

  private async dispatchEmail(payload: EmailPayload) {
    const webhook = process.env.AUTH_EMAIL_WEBHOOK_URL
    if (!webhook) {
      return
    }

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = new URL('/api/auth/verify-email/confirm', this.getBaseUrl())
    url.searchParams.set('token', token)

    await this.dispatchEmail({
      to: email,
      subject: 'Verifique seu email',
      text: `Confirme seu email acessando: ${url.toString()}`,
    })
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = new URL('/reset-password', this.getBaseUrl())
    url.searchParams.set('token', token)

    await this.dispatchEmail({
      to: email,
      subject: 'Reset de senha',
      text: `Redefina sua senha acessando: ${url.toString()}`,
    })
  }
}
