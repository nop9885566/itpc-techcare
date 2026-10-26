'use server';

import { AuthUser } from '@/lib/types'

const AUTH_KEY = 'itpc_techcare_user'

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_KEY)
}
