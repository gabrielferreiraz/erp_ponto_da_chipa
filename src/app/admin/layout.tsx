import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Sidebar } from './sidebar'
import { LiveClock } from '@/components/ui/live-clock'

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
    <div className="h-screen bg-[#F8F9FA] flex overflow-hidden font-sans">
      <Sidebar user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Sistema Ativo</span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="h-8 w-px bg-zinc-200/50 hidden sm:block" />
             <div className="hidden sm:flex items-center gap-3">
               <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Acesso em</span>
               <LiveClock className="text-sm font-mono font-black text-zinc-900 tabular-nums" />
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
