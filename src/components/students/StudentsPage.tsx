'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, ChevronRight, UserCircle2 } from 'lucide-react'
import { getStudentsWithCaseCount } from '@/lib/queries'
import type { StudentWithCaseCount } from '@/lib/types'
import { useRouter } from 'next/navigation'
import StudentFormModal from './StudentFormModal'

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithCaseCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStudentsWithCaseCount()
      setStudents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort() as string[]
  const rooms = Array.from(
    new Set(
      students
        .filter(s => !filterGrade || s.grade === filterGrade)
        .map(s => s.room)
        .filter(Boolean)
    )
  ).sort((a, b) => (a as number) - (b as number)) as number[]

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      s.first_name_th?.toLowerCase().includes(q) ||
      s.last_name_th?.toLowerCase().includes(q) ||
      s.nickname_th?.toLowerCase().includes(q) ||
      s.student_id?.includes(q)
    const matchGrade = !filterGrade || s.grade === filterGrade
    const matchRoom = !filterRoom || s.room === Number(filterRoom)
    return matchSearch && matchGrade && matchRoom
  })

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* App Bar */}
      <div className="app-bar">
        <h1 style={{ fontSize: '1.0625rem', flex: 1 }}>นักเรียน</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          เพิ่ม
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="search-wrapper" style={{ marginBottom: '0.5rem' }}>
          <Search size={16} className="search-icon" />
          <input
            className="input"
            placeholder="ค้นหาชื่อ ชื่อเล่น รหัส..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="input"
            style={{ flex: 1 }}
            value={filterGrade}
            onChange={e => {
              setFilterGrade(e.target.value)
              setFilterRoom('')
            }}
          >
            <option value="">ทุกชั้น</option>
            {grades.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            className="input"
            style={{ flex: 1 }}
            value={filterRoom}
            onChange={e => setFilterRoom(e.target.value)}
            disabled={!filterGrade}
          >
            <option value="">ทุกห้อง</option>
            {rooms.map(r => (
              <option key={r} value={String(r)}>ห้อง {r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student count */}
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        แสดง {filtered.length} จาก {students.length} คน
      </div>

      {/* List */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <span>กำลังโหลด...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <UserCircle2 size={40} strokeWidth={1.2} style={{ color: 'var(--color-border)' }} />
          <p>ไม่พบนักเรียน</p>
          {!search && !filterGrade && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={15} /> เพิ่มนักเรียน
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(s => (
            <button
              key={s.id}
              className="card card-sm animate-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                border: 'none',
                fontFamily: 'inherit',
              }}
              onClick={() => router.push(`/students/${s.id}`)}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: s.gender === 'ชาย' ? '#bfdbfe' : s.gender === 'หญิง' ? '#fbcfe8' : '#e9d5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: s.gender === 'ชาย' ? '#1e40af' : s.gender === 'หญิง' ? '#9d174d' : '#5b21b6',
                }}
              >
                {s.first_name_th?.[0] ?? '?'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
                  {s.first_name_th} {s.last_name_th}
                  {s.nickname_th && (
                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {' '}({s.nickname_th})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {s.student_id} · {s.grade}/{s.room}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                {s.case_count > 0 && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-primary-bg)',
                      color: 'var(--color-primary-dark)',
                      borderRadius: 9999,
                      padding: '0.2rem 0.625rem',
                    }}
                  >
                    {s.case_count} เคส
                  </span>
                )}
                <ChevronRight size={16} style={{ color: 'var(--color-text-light)' }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add student modal */}
      {showForm && (
        <StudentFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadStudents()
          }}
        />
      )}
    </div>
  )
}
