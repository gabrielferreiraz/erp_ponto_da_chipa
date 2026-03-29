import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Caixa — Ponto da Chipa',
}

export default async function CaixaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Guard: ADMIN ou CAIXA
  if (!session?.user || !['ADMIN', 'CAIXA'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex h-screen">
        <aside className="w-64 bg-white border-r border-zinc-200 flex-shrink-0">
          <div className="p-6 border-b border-zinc-100">
            <h1 className="font-bold text-lg text-amber-600">Ponto da Chipa</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Operação Caixa</p>
          </div>
          <nav className="p-4 space-y-1">
            <a href="/caixa/fila"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Fila de Pedidos
            </a>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs font-medium text-amber-800">{session.user.nome}</p>
              <p className="text-xs text-amber-600">Caixa</p>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
