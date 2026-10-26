'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import type { Student } from '@/lib/types'

interface StudentPickerProps {
  students: Student[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function StudentPicker({ students, selectedIds, onChange }: StudentPickerProps) {
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Grades and rooms from student data
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

  const selectedStudents = students.filter(s => selectedIds.includes(s.id))

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter(i => i !== id))
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref}>
      {/* Selected chips */}
      {selectedStudents.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
          {selectedStudents.map(s => (
            <span key={s.id} className="chip">
              {s.nickname_th ? `${s.first_name_th} (${s.nickname_th})` : s.first_name_th}{' '}
              {s.grade}/{s.room}
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`ลบ ${s.first_name_th}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        className="input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: selectedIds.length ? 'var(--color-text)' : 'var(--color-text-light)',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span>
          {selectedIds.length
            ? `เลือกแล้ว ${selectedIds.length} คน`
            : 'เลือกนักเรียน...'}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="card"
          style={{
            marginTop: '0.375rem',
            padding: '0.75rem',
            maxHeight: 320,
            overflowY: 'auto',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <div className="search-wrapper" style={{ flex: 1 }}>
              <Search size={15} className="search-icon" />
              <input
                className="input"
                style={{ fontSize: '0.875rem', minHeight: 36 }}
                placeholder="ค้นหาชื่อ รหัส..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <select
              className="input"
              style={{ width: 80, fontSize: '0.875rem', minHeight: 36 }}
              value={filterGrade}
              onChange={e => {
                setFilterGrade(e.target.value)
                setFilterRoom('')
              }}
            >
              <option value="">ชั้น</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {filterGrade && (
              <select
                className="input"
                style={{ width: 72, fontSize: '0.875rem', minHeight: 36 }}
                value={filterRoom}
                onChange={e => setFilterRoom(e.target.value)}
              >
                <option value="">ห้อง</option>
                {rooms.map(r => (
                  <option key={r} value={String(r)}>{r}</option>
                ))}
              </select>
            )}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
              ไม่พบนักเรียน
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filtered.map(s => {
                const isSelected = selectedIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: isSelected ? 'var(--color-primary-bg)' : 'transparent',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400, color: 'var(--color-text)' }}>
                        {s.first_name_th} {s.last_name_th}
                        {s.nickname_th && (
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            {' '}({s.nickname_th})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {s.student_id} · {s.grade}/{s.room}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
