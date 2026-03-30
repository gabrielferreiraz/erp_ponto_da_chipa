import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ponto da Chipa — Sistema de Gestão',
  description: 'Sistema de gestão de pedidos, caixa e estoque para a Ponto da Chipa',
}

import { Toaster } from 'sonner'
import { cn } from "@/lib/utils";


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
      </body>
    </html>
  )
}
