'use client'

import AppShell from '@/components/layout/AppShell'
import StudentsPage from '@/components/students/StudentsPage'

export default function StudentsRoute() {
  return (
    <AppShell>
      <StudentsPage />
    </AppShell>
  )
}
