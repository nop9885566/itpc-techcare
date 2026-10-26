'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight, List, CalendarDays, Users2, FileSpreadsheet } from 'lucide-react'
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

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

  function getCasesForDay(day: Date): CalendarCase[] {
    return cases.filter(c => {
      if (!c.scheduled_at) return false
      return isSameDayUtil(parseISO(c.scheduled_at), day)
    })
  }

  // List view: group by date
  const sortedCases = [...cases]
    .filter(c => c.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* App Bar */}
      <div className="app-bar">
        <h1 style={{ fontSize: '1.0625rem', flex: 1 }}>ปฏิทินเคส</h1>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <button
            className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, minHeight: 34, border: 'none' }}
            onClick={() => setViewMode('month')}
            title="มุมมองเดือน"
          >
            <CalendarDays size={16} />
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, minHeight: 34, border: 'none' }}
            onClick={() => setViewMode('list')}
            title="มุมมองรายการ"
          >
            <List size={16} />
          </button>
        </div>

        {/* Mine/All toggle */}
        <button
          className={`btn btn-sm ${showMine ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowMine(m => !m)}
          style={{ fontSize: '0.8125rem' }}
        >
          <Users2 size={15} />
          {showMine ? 'ของฉัน' : 'ทั้งหมด'}
        </button>

        {/* Excel export */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => exportMonthlyCasesToExcel(formatThaiMonthYear(currentMonth), cases)}
          title="ส่งออกรายงาน Excel ประจำเดือน"
          style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}
        >
          <FileSpreadsheet size={16} />
          <span className="hidden-mobile">Excel</span>
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <span>กำลังโหลด...</span>
        </div>
      ) : viewMode === 'month' ? (
        /* ========== MONTH VIEW ========== */
        <div style={{ padding: '1rem' }}>
          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(prevMonth(currentMonth))}
              style={{ width: 36, padding: '0.35rem', borderRadius: '50%' }}
            >
              <ChevronLeft size={18} />
            </button>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {formatThaiMonthYear(currentMonth)}
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(nextMonth(currentMonth))}
              style={{ width: 36, padding: '0.35rem', borderRadius: '50%' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="calendar-grid">
            {THAI_DAY_NAMES_SHORT.map(d => (
              <div key={d} className="day-header">{d}</div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayCases = getCasesForDay(day)
              const isToday = isSameDayUtil(day, today)
              const isCurrentMonth = isSameMonthUtil(day, currentMonth)
              return (
                <div
                  key={idx}
                  className={`calendar-cell${!isCurrentMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`}
                  style={{ cursor: dayCases.length > 0 ? 'pointer' : 'default' }}
                >
                  <div className="day-number">{day.getDate()}</div>
                  {dayCases.slice(0, 3).map(c => (
                    <span
                      key={c.id}
                      className={`event-pill ${c.status}`}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      title={getCaseTypeLabel(c.case_type, c.other_text)}
                    >
                      {getCaseTypeLabel(c.case_type, c.other_text).slice(0, 10)}
                      {c.students.length > 0 && ` ·${c.students.length}`}
                    </span>
                  ))}
                  {dayCases.length > 3 && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        paddingLeft: 2,
                      }}
                    >
                      +{dayCases.length - 3} อื่นๆ
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--color-planned)', display: 'inline-block' }} />
              กำหนดการ
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--color-done)', display: 'inline-block' }} />
              เสร็จสิ้น
            </span>
          </div>
        </div>
      ) : (
        /* ========== LIST VIEW ========== */
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {sortedCases.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={40} strokeWidth={1.2} style={{ color: 'var(--color-border)' }} />
              <p>ไม่มีเคสในขณะนี้</p>
              <p style={{ fontSize: '0.875rem' }}>กดปุ่ม + เพื่อเพิ่มเคสใหม่</p>
            </div>
          ) : (
            sortedCases.map(c => (
              <button
                key={c.id}
                className="card card-sm animate-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  border: 'none',
                  fontFamily: 'inherit',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span className={`badge badge-${c.status}`}>
                      {c.status === 'planned' ? 'กำหนดการ' : 'เสร็จสิ้น'}
                    </span>
                    <span className={`badge badge-${c.case_type}`} style={{ fontSize: '0.75rem' }}>
                      {getCaseTypeLabel(c.case_type, c.other_text).slice(0, 20)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                    {formatThaiDate(c.scheduled_at)}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {c.students.slice(0, 3).map(s => s.nickname_th || s.first_name_th).join(', ')}
                    {c.students.length > 3 && ` และอีก ${c.students.length - 3} คน`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className="fab"
        onClick={() => setShowForm(true)}
        aria-label="เพิ่มเคสใหม่"
      >
        <Plus size={26} />
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
