import 'server-only'

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const SESSION_COOKIE = 'itpctakecare_session'

export async function getSupabaseClient(options?: { anonymous?: boolean; sessionToken?: string }) {
  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.')
  }

  const sessionToken = options?.anonymous
    ? undefined
    : options?.sessionToken ?? (await cookies()).get(SESSION_COOKIE)?.value

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(sessionToken && {
      global: { headers: { 'x-app-session': sessionToken } },
    }),
  })
}
