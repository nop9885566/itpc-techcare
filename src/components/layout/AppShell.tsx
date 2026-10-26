'use client'

import React from 'react'
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import LoginPage from '@/components/auth/LoginPage'
import BottomNav from '@/components/layout/BottomNav'
import { LogOut, UserCircle } from 'lucide-react'

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>กำลังเปิดระบบ ITPC Techcare...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            maxWidth: 1024,
            margin: '0 auto',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: -0.5,
              }}
            >
              IT
            </div>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                ITPC Techcare
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1 }}>
                ระบบบันทึกและติดตามการดูแลนักเรียน
              </p>
            </div>
          </div>

          {/* User profile & logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '0.25rem 0.625rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text)',
              }}
            >
              <UserCircle size={16} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 500 }}>{user.name}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm(`ออกจากระบบ (${user.name}) ใช่หรือไม่?`)) {
                  logout()
                }
              }}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.35rem', borderRadius: 8, color: 'var(--color-text-muted)' }}
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Persistent Bottom Navigation for Mobile & Quick Access */}
      <BottomNav />
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  )
}
