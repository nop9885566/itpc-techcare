'use client'

import { Calendar, Users, LogOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/calendar', label: 'ปฏิทินเคส', icon: Calendar },
  { href: '/students', label: 'นักเรียน', icon: Users },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="เมนูหลัก">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <button
            key={href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            onClick={() => router.push(href)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        )
      })}

      {/* User / Logout */}
      <button
        className="bottom-nav-item"
        onClick={() => {
          if (confirm(`ออกจากระบบ (${user?.name}) ใช่หรือไม่?`)) {
            logout()
          }
        }}
        aria-label="ออกจากระบบ"
        style={{ maxWidth: 80 }}
      >
        <LogOut size={22} strokeWidth={1.8} />
        <span style={{ fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 64 }}>
          {user?.name ?? 'ออกจากระบบ'}
        </span>
      </button>
    </nav>
  )
}
