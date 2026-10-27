'use client'

import { Calendar, Users, UserCircle, ShieldCheck } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/calendar', label: 'ปฏิทินเคส', icon: Calendar },
  { href: '/students', label: 'นักเรียน', icon: Users },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="เมนูหลัก">
      <div className="bottom-nav-inner">
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

        {user?.role === 'admin' && (
          <button
            className={`bottom-nav-item${pathname.startsWith('/admin') ? ' active' : ''}`}
            onClick={() => router.push('/admin')}
            aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
          >
            <ShieldCheck size={22} strokeWidth={1.8} />
            <span>จัดการระบบ</span>
          </button>
        )}

        <button
          className={`bottom-nav-item${pathname.startsWith('/profile') ? ' active' : ''}`}
          onClick={() => router.push('/profile')}
          aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
          aria-label="ข้อมูลส่วนตัว"
        >
          <UserCircle size={22} strokeWidth={1.8} />
          <span style={{ fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
            โปรไฟล์
          </span>
        </button>
      </div>
    </nav>
  )
}
