import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ChefHat, LogOut, UserCircle } from 'lucide-react'
import { logoutAction } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Atendimento — Ponto da Chipa',
}

export default async function AtendenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Guard: ADMIN ou ATENDENTE
  if (!session?.user || !['ADMIN', 'ATENDENTE'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header Responsivo (Substitui a Sidebar) */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600 rounded-lg p-1.5 shadow-sm">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm text-zinc-900 tracking-tighter uppercase leading-none">Ponto da Chipa</h1>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-0.5">Atendimento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
              <UserCircle className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-700">{session.user.nome}</span>
            </div>
            
            <form action={logoutAction}>
              <button 
                type="submit"
                className="p-2 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full mx-auto max-w-[1600px]">
        {children}
      </main>
    </div>
  )
}
