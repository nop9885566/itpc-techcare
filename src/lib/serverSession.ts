import 'server-only'

import { cookies } from 'next/headers'
import { getSupabaseClient } from '@/lib/supabase'
import type { AuthUser } from '@/lib/types'

const SESSION_COOKIE = 'itpctakecare_session'
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false
  if (!('id' in value) || typeof value.id !== 'string') return false
  if (!('name' in value) || typeof value.name !== 'string') return false
  return 'role' in value && (value.role === 'admin' || value.role === 'caretaker')
}

export async function createSession(sessionToken: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(sessionToken)) {
    throw new Error('The database returned an invalid session token.')
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_LIFETIME_SECONDS,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    const { error } = await (await getSupabaseClient({ sessionToken })).rpc('logout_caretaker')
    if (error) throw error
  }

  cookieStore.delete(SESSION_COOKIE)
}

async function getActiveUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionToken || !/^[a-f0-9]{64}$/.test(sessionToken)) return null

  const { data, error } = await (await getSupabaseClient({ sessionToken })).rpc('current_caretaker')
  if (error) throw error
  return isAuthUser(data) ? data : null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getActiveUser()
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getActiveUser()
  if (!user) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง')
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('รายการนี้อนุญาตเฉพาะผู้ดูแลระบบ')
  return user
}
