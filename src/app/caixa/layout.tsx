import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { SidebarCaixa } from './sidebar-caixa'
import { LiveClock } from '@/components/ui/live-clock'

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
    <div className="h-screen bg-[#F8F9FA] flex overflow-hidden font-sans">
      <SidebarCaixa user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-[#F29100] via-[#E24A07] to-[#B91C1C] p-2 rounded-xl shadow-[0_4px_8px_-2px_rgba(226,74,7,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline-block">Caixa Operante</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-px bg-zinc-200/50 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Turno iniciado em</span>
              <LiveClock className="text-sm font-mono font-black text-zinc-900 tabular-nums" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar">
          <div className="mx-auto max-w-[1600px] h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
