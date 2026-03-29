import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — Ponto da Chipa',
  description: 'Acesse o sistema de gestão da Ponto da Chipa',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
