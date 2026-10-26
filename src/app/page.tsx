'use client'

import AppShell from '@/components/layout/AppShell'
import CalendarPage from '@/components/calendar/CalendarPage'

export default function Home() {
  return (
    <AppShell>
      <CalendarPage />
    </AppShell>
  )
}
