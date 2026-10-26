'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import CaseDetailPage from '@/components/cases/CaseDetailPage'

export default function CaseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  return (
    <AppShell>
      <CaseDetailPage caseId={resolvedParams.id} />
    </AppShell>
  )
}
