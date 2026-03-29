'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'

export function LogoutButtonAdmin() {
  return (
    <button
      onClick={() => logoutAction()}
      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-bold border border-red-100 shadow-sm"
    >
      <LogOut className="h-4 w-4" />
      Deslogar
    </button>
  )
}
