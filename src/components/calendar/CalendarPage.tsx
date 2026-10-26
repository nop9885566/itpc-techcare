'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Users2,
  FileSpreadsheet,
} from 'lucide-react'
import { getCasesForCalendar, getStudents, getCaretakers } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'
import type { CalendarCase, Student, Caretaker } from '@/lib/types'
import { getCaseTypeLabel } from '@/lib/types'
import { exportMonthlyCasesToExcel } from '@/lib/excelExport'
import {
  getCalendarDays,
  isSameDayUtil,
  isSameMonthUtil,
  formatThaiMonthYear,
  nextMonth,
  prevMonth,
  formatThaiDate,
  THAI_DAY_NAMES_SHORT,
} from '@/lib/dateUtils'
import CaseFormModal from '@/components/cases/CaseFormModal'
import { useRouter } from 'next/navigation'
import { parseISO } from 'date-fns'

type ViewMode = 'month' | 'list'

export default function CalendarPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [cases, setCases] = useState<CalendarCase[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [caretakers, setCaretakers] = useState<Caretaker[]>([])
  const [loading, setLoading] = useState(true)
  const [showMine, setShowMine] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [showForm, setShowForm] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [casesData, studentsData, caretakersData] = await Promise.all([
        getCasesForCalendar(showMine ? user?.id : null),
        getStudents(),
        getCaretakers(),
      ])
      setCases(casesData)
      setStudents(studentsData)
      setCaretakers(caretakersData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [showMine, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const calendarDays = getCalendarDays(currentMonth)
  const today = new Date()

  // Get cases for a specific day
  function getCasesForDay(day: Date): CalendarCase[] {
    return cases.filter(c => {
      if (!c.scheduled_at) return false
      try {
        const caseDate = parseISO(c.scheduled_at)
        return isSameDayUtil(caseDate, day)
      } catch {
        return false
      }
    })
  }

  // List view: sort by date
  const sortedCases = [...cases]
    .filter(c => c.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())

  // Monthly stats
  const plannedCount = cases.filter(c => c.status === 'planned').length
  const doneCount = cases.filter(c => c.status === 'done').length

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '1.25rem 1rem', paddingBottom: '6.5rem' }}>
      {/* Top Header Card & Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Left: Month Navigator & Quick Jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(prevMonth(currentMonth))}
              style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }}
              title="เดือนก่อนหน้า"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(nextMonth(currentMonth))}
              style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }}
              title="เดือนถัดไป"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {formatThaiMonthYear(currentMonth)}
          </h2>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentMonth(new Date())}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.625rem',
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            วันนี้
          </button>
        </div>

        {/* Right: Controls & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <button
              className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0, height: 34, border: 'none', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              onClick={() => setViewMode('month')}
            >
              <CalendarDays size={15} />
              <span style={{ fontSize: '0.8125rem' }}>เดือน</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0, height: 34, border: 'none', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              onClick={() => setViewMode('list')}
            >
              <List size={15} />
              <span style={{ fontSize: '0.8125rem' }}>รายการ</span>
            </button>
          </div>

          {/* Mine/All toggle */}
          <button
            className={`btn btn-sm ${showMine ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowMine(m => !m)}
            style={{ height: 34, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Users2 size={15} />
            <span>{showMine ? 'เคสของฉัน' : 'เคสทั้งหมด'}</span>
          </button>

          {/* Excel export */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportMonthlyCasesToExcel(formatThaiMonthYear(currentMonth), cases)}
            title="ส่งออกรายงาน Excel ประจำเดือน"
            style={{ height: 34, display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
          >
            <FileSpreadsheet size={15} />
            <span className="hidden-mobile">Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <div className="spinner" />
          <span style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>กำลังโหลดข้อมูลเคส...</span>
        </div>
      ) : viewMode === 'month' ? (
        /* ========== MONTH VIEW ========== */
        <div>
          {/* Calendar Card Container */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div className="calendar-grid" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              {THAI_DAY_NAMES_SHORT.map((d, index) => (
                <div
                  key={d}
                  className="day-header"
                  style={{
                    color: index === 0 ? '#ef4444' : index === 6 ? '#8b5cf6' : 'var(--color-text-muted)',
                    padding: '0.625rem 0.25rem',
                  }}
                >
                  {d}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayCases = getCasesForDay(day)
                const isToday = isSameDayUtil(day, today)
                const isCurrentMonth = isSameMonthUtil(day, currentMonth)
                return (
                  <div
                    key={idx}
                    className={`calendar-cell${!isCurrentMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`}
                    style={{
                      cursor: dayCases.length > 0 ? 'pointer' : 'default',
                      minHeight: 110,
                    }}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    {dayCases.slice(0, 3).map(c => (
                      <span
                        key={c.id}
                        className={`event-pill ${c.status}`}
                        onClick={() => router.push(`/cases/${c.id}`)}
                        title={getCaseTypeLabel(c.case_type, c.other_text)}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {getCaseTypeLabel(c.case_type, c.other_text)}
                        </span>
                        {c.students.length > 0 && (
                          <span style={{ opacity: 0.85, fontSize: '0.6875rem', display: 'block', marginTop: 1 }}>
                            ({c.students.length} คน)
                          </span>
                        )}
                      </span>
                    ))}
                    {dayCases.length > 3 && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--color-primary-dark)',
                          fontWeight: 600,
                          display: 'block',
                          paddingLeft: 2,
                          marginTop: 2,
                        }}
                      >
                        +{dayCases.length - 3} เคสเพิ่มเติม
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend and Monthly Summary */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: 'var(--color-planned)',
                    border: '1px solid rgba(30, 64, 175, 0.3)',
                    display: 'inline-block',
                  }}
                />
                กำหนดการ (Planned)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: 'var(--color-done)',
                    border: '1px solid rgba(22, 101, 52, 0.3)',
                    display: 'inline-block',
                  }}
                />
                เสร็จสิ้น (Done)
              </span>
            </div>

            <div>
              เคสทั้งหมดในมุมมองนี้: <strong style={{ color: 'var(--color-text)' }}>{cases.length} เคส</strong>{' '}
              (รอดำเนินการ {plannedCount} / เสร็จสิ้น {doneCount})
            </div>
          </div>
        </div>
      ) : (
        /* ========== LIST VIEW ========== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedCases.length === 0 ? (
            <div className="card empty-state" style={{ padding: '3rem 1rem' }}>
              <CalendarDays size={44} strokeWidth={1.2} style={{ color: 'var(--color-border)' }} />
              <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>ไม่มีเคสในขณะนี้</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                กดปุ่ม + มุมล่างขวาเพื่อเพิ่มเคสใหม่
              </p>
            </div>
          ) : (
            sortedCases.map(c => (
              <button
                key={c.id}
                className="card card-sm animate-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  transition: 'transform 0.1s, border-color 0.2s',
                  padding: '1rem',
                }}
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                <div
                  style={{
                    width: 4,
                    alignSelf: 'stretch',
                    borderRadius: 4,
                    backgroundColor: c.status === 'planned' ? 'var(--color-planned-text)' : '#166534',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                    <span className={`badge badge-${c.status}`}>
                      {c.status === 'planned' ? 'กำหนดการ' : 'เสร็จสิ้น'}
                    </span>
                    <span className={`badge badge-${c.case_type}`}>
                      {getCaseTypeLabel(c.case_type, c.other_text)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                    นัดหมาย: {formatThaiDate(c.scheduled_at)}
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    นักเรียน:{' '}
                    {c.students.slice(0, 3).map(s => s.nickname_th || s.first_name_th).join(', ')}
                    {c.students.length > 3 && ` และอีก ${c.students.length - 3} คน`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      <button
        className="fab"
        onClick={() => setShowForm(true)}
        aria-label="เพิ่มเคสใหม่"
        title="เพิ่มเคสใหม่"
      >
        <Plus size={28} />
      </button>

      {/* Case Form Modal */}
      {showForm && (
        <CaseFormModal
          students={students}
          caretakers={caretakers}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
