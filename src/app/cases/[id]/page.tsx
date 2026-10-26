'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import CaseDetailPage from '@/components/cases/CaseDetailPage'

function CaseDetailContent() {
  const params = useParams()
  const caseId = (params?.id as string) || ''
  return <CaseDetailPage caseId={caseId} />
}

export default function CaseDetailRoute() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="empty-state" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        }
      >
        <CaseDetailContent />
      </Suspense>
    </AppShell>
  )
}
