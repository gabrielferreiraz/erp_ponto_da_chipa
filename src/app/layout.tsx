import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { PwaRegister } from '@/components/pwa-register'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ponto da Chipa — Sistema de Gestão',
  description: 'Sistema de gestão de pedidos, caixa e estoque para a Ponto da Chipa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ponto da Chipa',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body
        className={cn(
          'min-h-screen bg-[#FAFAFA] font-sans antialiased text-zinc-900',
          inter.className
        )}
      >
        {children}
        <Toaster richColors position="top-right" />
        <PwaRegister />
      </body>
    </html>
  )
}
