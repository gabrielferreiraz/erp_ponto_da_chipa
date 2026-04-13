'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  Tags,
  Table2,
  Users2,
  ClipboardList,
  History,
  LogOut,
  ChevronRight,
  UserCircle,
  ChevronLeft,
  Menu,
  X,
  ShoppingCart,
  UtensilsCrossed,
  ExternalLink,
} from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: Tags },
  { label: 'Mesas', href: '/admin/mesas', icon: Table2 },
  { label: 'Usuários', href: '/admin/usuarios', icon: Users2 },
  { label: 'Estoque', href: '/admin/estoque', icon: ClipboardList },
  { label: 'Fechamento', href: '/admin/fechamento', icon: History },
]

interface SidebarProps {
  user: { nome: string; role: string }
}

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  return (
    <>
      {/* ── Mobile Top Bar (PWA safe) ── */}
      <div className="lg:hidden flex items-center justify-between fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-zinc-200/60 pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))] px-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 -ml-2 rounded-xl text-zinc-600 hover:bg-zinc-100/80 active:bg-zinc-200/80 transition-colors"
            aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <Menu className="w-[22px] h-[22px]" strokeWidth={2.5} />
          </button>
          <div className="w-14 h-14 rounded-[14px] bg-white shadow-sm border border-zinc-100 flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" priority />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <p className="text-[11px] font-bold text-zinc-900 leading-none">{user.nome.split(' ')[0]}</p>
            <p className="text-[9px] font-bold text-[#E24A07] uppercase tracking-widest mt-0.5">Admin</p>
          </div>
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-zinc-50 border border-zinc-200/60 shadow-inner flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[45] lg:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          // base
          'bg-white border-r border-zinc-200/60 flex flex-col flex-shrink-0 z-50',
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
          className="hidden lg:flex absolute -right-3 top-24 w-8 h-24 bg-white border border-zinc-200 rounded-full items-center justify-center shadow-sm hover:bg-zinc-50 transition-colors z-50"
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronLeft className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform duration-300', isCollapsed && 'rotate-180')} />
        </button>

        {/* Logo */}
        {/* ↓↓ AJUSTE DE TAMANHO ↓↓
            Expandido:  altere w-[88px] h-[88px] e width={80} height={80}
            Recolhido:  altere w-10 h-10 e width={36} height={36}          */}
        <div className={cn('block transition-all duration-300', isCollapsed ? 'px-3 pt-5 pb-3' : 'px-6 pt-6 pb-4')}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <span className="text-xs font-black uppercase text-zinc-400 tracking-widest pl-1">Menu</span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 -mr-2 rounded-xl text-zinc-400 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={cn(
            'hidden lg:flex rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] items-center justify-center overflow-hidden border border-zinc-100 transition-all duration-300',
            isCollapsed ? 'w-20 h-20' : 'w-[188px] h-[108px]'
          )}>
            <Image
              src="/logo.png"
              alt="Ponto da Chipa"
              width={isCollapsed ? 70 : 102}
              height={isCollapsed ? 70 : 102}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Nav — scrolls internally if many items */}
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

        {/* Operações — links discretos para visão de caixa/atendente */}
        {!isCollapsed && (
          <div className="px-4 pb-3">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-300 px-4 mb-2">Operações</p>
            <Link
              href="/caixa/fila"
              className="group flex items-center justify-between px-4 py-2.5 rounded-2xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 flex-shrink-0 group-hover:text-[#E24A07] transition-colors" strokeWidth={1.5} />
                <span className="text-xs font-semibold tracking-tight">Visão de Caixa</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </Link>
            <Link
              href="/atendente/pedidos"
              className="group flex items-center justify-between px-4 py-2.5 rounded-2xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-4 h-4 flex-shrink-0 group-hover:text-[#E24A07] transition-colors" strokeWidth={1.5} />
                <span className="text-xs font-semibold tracking-tight">Visão de Atendente</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </Link>
          </div>
        )}

        {/* User & Logout — always visible at bottom */}
        <div className={cn('shrink-0 border-t border-zinc-100/80 bg-zinc-50/30 transition-all duration-300', isCollapsed ? 'p-4' : 'p-6')}>
          {isCollapsed ? (
            /* Collapsed: avatar + logout stacked */
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
            /* Expanded: card with name + logout */
            <div className="flex items-center justify-between gap-3 px-4 py-4 rounded-3xl bg-white border border-zinc-200/50 shadow-sm ring-1 ring-zinc-950/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200/50 flex-shrink-0 shadow-inner">
                  <UserCircle className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate leading-none">{user.nome.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Admin</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                  title="Sair do Painel"
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
