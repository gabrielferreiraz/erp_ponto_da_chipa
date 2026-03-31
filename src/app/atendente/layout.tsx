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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      {/* Header Responsivo (Substitui a Sidebar) */}
      <header className="sticky top-0 z-40 w-full min-h-[64px] bg-white/70 backdrop-blur-md border-b border-zinc-950/[0.06] shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-zinc-900" strokeWidth={1.5} />
            <div>
              <h1 className="font-semibold text-[15px] text-zinc-900 tracking-tighter leading-none">Ponto da Chipa</h1>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Atendimento</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[13px] font-medium tracking-tight text-zinc-600">{session.user.nome}</span>
            </div>
            
            <form action={logoutAction}>
              <button 
                type="submit"
                className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-zinc-950/[0.06] text-zinc-400 hover:text-red-600 hover:bg-red-50 hover:ring-red-100 transition-all active:scale-[0.96]"
                title="Sair"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
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
