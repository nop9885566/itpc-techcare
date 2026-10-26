'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import LoginPage from '@/components/auth/LoginPage'
import BottomNav from '@/components/layout/BottomNav'
import { LogOut, UserCircle, Calendar, Users } from 'lucide-react'

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

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

  const isCalendar = pathname === '/' || pathname.startsWith('/calendar')
  const isStudents = pathname.startsWith('/students')

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
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Logo */}
          <div
            onClick={() => router.push('/calendar')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: -0.5,
                boxShadow: '0 2px 6px rgba(159, 119, 180, 0.3)',
              }}
            >
              IT
            </div>
            <div>
              <h1 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.15, margin: 0 }}>
                ITPC Techcare
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1, margin: '2px 0 0' }}>
                ระบบบันทึกและติดตามการดูแลนักเรียน
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-nav-tabs">
            <button
              type="button"
              onClick={() => router.push('/calendar')}
              className={`desktop-tab ${isCalendar ? 'active' : ''}`}
            >
              <Calendar size={17} strokeWidth={isCalendar ? 2.2 : 1.8} />
              <span>ปฏิทินเคส</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/students')}
              className={`desktop-tab ${isStudents ? 'active' : ''}`}
            >
              <Users size={17} strokeWidth={isStudents ? 2.2 : 1.8} />
              <span>นักเรียน</span>
            </button>
          </nav>

          {/* User profile & logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '0.3rem 0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text)',
              }}
            >
              <UserCircle size={17} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm(`ออกจากระบบ (${user.name}) ใช่หรือไม่?`)) {
                  logout()
                }
              }}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '0.4rem',
                borderRadius: 8,
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
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

      {/* Bottom Navigation for Mobile Only */}
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
