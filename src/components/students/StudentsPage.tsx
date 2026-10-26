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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.25rem 1rem', paddingBottom: '6.5rem' }}>
      {/* Top Header Card */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
            รายชื่อนักเรียน
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            แสดง {filtered.length} จากทั้งหมด {students.length} คน
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: 36 }}
        >
          <Plus size={16} />
          <span>เพิ่มนักเรียน</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="input"
              placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัสนักเรียน..."
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
              <option value="">ทุกระดับชั้น</option>
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
      </div>

      {/* List */}
      {loading ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <div className="spinner" />
          <span style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>กำลังโหลดรายชื่อนักเรียน...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem 1rem' }}>
          <UserCircle2 size={44} strokeWidth={1.2} style={{ color: 'var(--color-border)' }} />
          <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>ไม่พบข้อมูลนักเรียน</p>
          {!search && !filterGrade && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(true)} style={{ marginTop: '0.5rem' }}>
              <Plus size={15} /> เพิ่มนักเรียนคนแรก
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
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
