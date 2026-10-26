'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import StudentDetailPage from '@/components/students/StudentDetailPage'

function StudentDetailContent() {
  const params = useParams()
  const studentId = (params?.id as string) || ''
  return <StudentDetailPage studentId={studentId} />
}

export default function StudentDetailRoute() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="empty-state" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        }
      >
        <StudentDetailContent />
      </Suspense>
    </AppShell>
  )
}
