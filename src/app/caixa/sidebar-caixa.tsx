'use client'

import { useState, useEffect } from 'react'
import {
  ChefHat,
  ClipboardList,
  LogOut,
  ChevronRight,
  UserCircle,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Fila de Pedidos', href: '/caixa/fila', icon: ClipboardList },
]

interface SidebarProps {
  user: { nome: string; role: string }
}

export function SidebarCaixa({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  return (
    <>
      {/* ── Mobile toggle (FAB) ── */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-[#E24A07] text-white rounded-full shadow-2xl active:scale-95 transition-transform"
        aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* ── Mobile overlay ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'bg-white border-r border-zinc-200/60 flex flex-col flex-shrink-0 z-40',
          'shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out',
          // desktop: sticky, full viewport height
          'lg:sticky lg:top-0 lg:h-screen',
          // desktop width
          isCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]',
          // mobile: fixed drawer
          'fixed inset-y-0 left-0 w-[280px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-zinc-200 rounded-full items-center justify-center shadow-sm hover:bg-zinc-50 transition-colors z-50"
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronLeft className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform duration-300', isCollapsed && 'rotate-180')} />
        </button>

        {/* Logo */}
        <div className={cn('p-8 transition-all duration-300', isCollapsed ? 'px-6' : 'px-8')}>
          <div className="flex items-center gap-4 group cursor-default overflow-hidden">
            <div className="bg-gradient-to-br from-[#F29100] via-[#E24A07] to-[#B91C1C] p-3 rounded-2xl shadow-[0_8px_16px_-4px_rgba(226,74,7,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
              <ChefHat className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className={cn('space-y-0.5 transition-all duration-300', isCollapsed ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100')}>
              <h1 className="text-lg font-black tracking-tighter text-zinc-900 leading-none uppercase whitespace-nowrap">Ponto da Chipa</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap">Operação Caixa</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98]',
                  isActive ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <item.icon
                    className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-[#E24A07]' : 'group-hover:text-[#E24A07]')}
                    strokeWidth={1.5}
                  />
                  <span className={cn('text-sm font-semibold tracking-tight transition-all duration-300 whitespace-nowrap', isCollapsed ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100')}>
                    {item.label}
                  </span>
                </div>
                {!isCollapsed && (
                  <ChevronRight className={cn('w-4 h-4 transition-all text-zinc-300', isActive ? 'opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0')} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User & Logout — always visible at bottom */}
        <div className={cn('shrink-0 border-t border-zinc-100/80 bg-zinc-50/30 transition-all duration-300', isCollapsed ? 'p-4' : 'p-6')}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200/50 shadow-inner">
                <UserCircle className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-4 rounded-3xl bg-white border border-zinc-200/50 shadow-sm ring-1 ring-zinc-950/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200/50 flex-shrink-0 shadow-inner">
                  <UserCircle className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate leading-none">{user.nome.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Caixa</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                  title="Sair do Caixa"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
