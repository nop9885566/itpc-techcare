'use client'

import React, { Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import LoginPage from '@/components/auth/LoginPage'
import BottomNav from '@/components/layout/BottomNav'
import BrandLogo from '@/components/brand/BrandLogo'
import { LogOut, UserCircle, Calendar, Users, ShieldCheck } from 'lucide-react'

function RouteNavigation({ role }: { role: 'admin' | 'caretaker' }) {
  const pathname = usePathname()
  const router = useRouter()
  const isCalendar = pathname === '/' || pathname.startsWith('/calendar')
  const isStudents = pathname.startsWith('/students')
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
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
        {role === 'admin' && (
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className={`desktop-tab ${isAdmin ? 'active' : ''}`}
          >
            <ShieldCheck size={17} strokeWidth={isAdmin ? 2.2 : 1.8} />
            <span>จัดการระบบ</span>
          </button>
        )}
      </nav>
      <BottomNav />
    </>
  )
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>กำลังเปิดระบบ itpctakecare...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const authenticatedUser = user

  async function handleLogout() {
    if (!confirm(`ออกจากระบบ (${authenticatedUser.name}) ใช่หรือไม่?`)) return
    try {
      await logout()
    } catch (error) {
      console.error('Unable to sign out.', error)
      alert('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(48, 45, 50, 0.035)',
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
          <button
            type="button"
            onClick={() => router.push('/calendar')}
            aria-label="ไปหน้าปฏิทิน itpctakecare"
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', border: 0, padding: 0, background: 'transparent', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <BrandLogo />
            <div>
              <h1 style={{ fontSize: '1.0625rem', fontWeight: 750, color: 'var(--color-text)', lineHeight: 1.15, margin: 0, letterSpacing: '-0.04em' }}>
                itpctakecare
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1, margin: '2px 0 0' }}>
                ระบบบันทึกและติดตามการดูแลนักเรียน
              </p>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <Suspense fallback={null}>
            <RouteNavigation role={user.role} />
          </Suspense>

          {/* User profile & logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => router.push('/profile')}
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
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title="แก้ไขข้อมูลส่วนตัว"
            >
              <UserCircle size={17} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
              <span className="role-pill">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครูที่ปรึกษา'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
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
