'use server'

import { signOut } from '@/lib/auth-instance'

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
