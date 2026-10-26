'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import StudentDetailPage from '@/components/students/StudentDetailPage'

export default function StudentDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  return (
    <AppShell>
      <StudentDetailPage studentId={resolvedParams.id} />
    </AppShell>
  )
}
