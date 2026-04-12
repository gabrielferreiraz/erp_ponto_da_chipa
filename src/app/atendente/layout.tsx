import { auth } from '@/lib/auth-instance'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LogOut, UserCircle, ShoppingBag, ClipboardList } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import { AtendenteBottomNav } from '@/components/atendente/bottom-nav'

export const metadata: Metadata = {
  title: 'Atendimento — Ponto da Chipa',
}

export default async function AtendenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || !['ADMIN', 'ATENDENTE'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans overflow-x-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-950/[0.06] shadow-sm">
        <div className="mx-auto max-w-[1600px] px-5 md:px-12 h-14 flex items-center justify-between">

          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Ponto da Chipa"
            width={80}
            height={40}
            className="object-contain mix-blend-multiply"
            priority
          />

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
            <Link
              href="/atendente/pedidos"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-zinc-500 hover:text-zinc-900 hover:bg-white transition-all"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Pedidos
            </Link>
            <Link
              href="/atendente/visor"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-zinc-500 hover:text-zinc-900 hover:bg-white transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Repor Visor
            </Link>
          </nav>

          {/* Usuário + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[13px] font-medium tracking-tight text-zinc-600">{session.user.nome.split(' ')[0]}</span>
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

      {/* ── Conteúdo — padding inferior para não ficar atrás do bottom nav no mobile ── */}
      <main className="flex-1 w-full mx-auto max-w-[1600px] pb-24 sm:pb-0">
        {children}
      </main>

      {/* ── Bottom nav — só mobile ── */}
      <AtendenteBottomNav />
    </div>
  )
}
