'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AuthUser } from '@/lib/types'
import { getAuthUser, setAuthUser, clearAuthUser } from '@/lib/auth'

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
    const stored = getAuthUser()
    setUser(stored)
    setIsLoading(false)
  }, [])

  const login = useCallback((u: AuthUser) => {
    setAuthUser(u)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    clearAuthUser()
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
