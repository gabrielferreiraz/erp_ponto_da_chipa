import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LogoutButtonAdmin } from '@/components/admin/logout-button'

export const metadata: Metadata = {
  title: 'Administração — Ponto da Chipa',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Guard: apenas ADMIN
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar + main virão nas próximas fases */}
      <div className="flex h-screen">
        <aside className="w-64 bg-white border-r border-zinc-200 flex-shrink-0">
          <div className="p-6 border-b border-zinc-100">
            <h1 className="font-bold text-lg text-amber-600">Ponto da Chipa</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Administração</p>
          </div>
          <nav className="p-4 space-y-1">
            <a href="/admin/dashboard"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Dashboard
            </a>
            <a href="/admin/produtos"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Produtos
            </a>
            <a href="/admin/categorias"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Categorias
            </a>
            <a href="/admin/mesas"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Mesas
            </a>
            <a href="/admin/usuarios"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Usuários
            </a>
            <a href="/admin/estoque"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Estoque
            </a>
            <a href="/admin/fechamento"
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
              Fechamento de Turno
            </a>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs font-medium text-amber-800">{session.user.nome}</p>
              <p className="text-xs text-amber-600">Administrador</p>
            </div>
            <LogoutButtonAdmin />
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
