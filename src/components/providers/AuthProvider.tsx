'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AuthUser } from '@/lib/types'
import { getAuthenticatedUser, logoutCaretaker } from '@/lib/queries'

interface AuthContextValue {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getAuthenticatedUser()
      .then(setUser)
      .catch(error => {
        console.error('Unable to verify the current session.', error)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback((u: AuthUser) => {
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    await logoutCaretaker()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
