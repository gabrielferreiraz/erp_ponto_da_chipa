'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/atendente/pedidos', label: 'Pedidos',     icon: ClipboardList },
  { href: '/atendente/visor',   label: 'Repor Visor', icon: ShoppingBag   },
]

export function AtendenteBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-zinc-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-2 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all active:scale-95',
                isActive ? 'text-zinc-900' : 'text-zinc-400'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all',
                isActive ? 'bg-zinc-900' : ''
              )}>
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : '')} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                isActive ? 'text-zinc-900' : 'text-zinc-400'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
