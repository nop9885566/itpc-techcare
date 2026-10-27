'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { createStudent, updateStudent } from '@/lib/queries'
import type { Student } from '@/lib/types'

interface StudentFormModalProps {
  student?: Student
  onClose: () => void
  onSaved: () => void
}

const GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6']
const GENDERS = ['ชาย', 'หญิง', 'ไม่ระบุ']

export default function StudentFormModal({ student, onClose, onSaved }: StudentFormModalProps) {
  const [studentId, setStudentId] = useState(student?.student_id ?? '')
  const [firstName, setFirstName] = useState(student?.first_name_th ?? '')
  const [lastName, setLastName] = useState(student?.last_name_th ?? '')
  const [nickname, setNickname] = useState(student?.nickname_th ?? '')
  const [grade, setGrade] = useState(student?.grade ?? 'ม.1')
  const [room, setRoom] = useState(String(student?.room ?? '1'))
  const [gender, setGender] = useState(student?.gender ?? 'ไม่ระบุ')
  const [academicYear, setAcademicYear] = useState(String(student?.academic_year ?? new Date().getFullYear() + 543))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName.trim()) {
      setError('กรุณากรอกชื่อนักเรียน')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        student_id: studentId || null,
        first_name_th: firstName.trim(),
        last_name_th: lastName.trim() || null,
        nickname_th: nickname.trim() || null,
        grade: grade || null,
        room: room ? Number(room) : null,
        gender: gender || null,
        academic_year: Number(academicYear),
      }

      if (student) {
        await updateStudent(student.id, payload)
      } else {
        await createStudent(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>
            {student ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 36, padding: '0.35rem', width: 36, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="student-id">รหัสนักเรียน</label>
              <input
                id="student-id"
                className="input"
                type="text"
                placeholder="เช่น 67001"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="first-name">
                ชื่อ <span style={{ color: 'var(--color-error-text)' }}>*</span>
              </label>
              <input
                id="first-name"
                className="input"
                type="text"
                placeholder="ชื่อจริง"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="last-name">นามสกุล</label>
              <input
                id="last-name"
                className="input"
                type="text"
                placeholder="นามสกุล"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="nickname">ชื่อเล่น</label>
              <input
                id="nickname"
                className="input"
                type="text"
                placeholder="ชื่อเล่น"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="grade">ชั้น</label>
              <select
                id="grade"
                className="input"
                value={grade}
                onChange={e => setGrade(e.target.value)}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="room">ห้อง</label>
              <input
                id="room"
                className="input"
                type="number"
                min={1}
                max={20}
                value={room}
                onChange={e => setRoom(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="academic-year">ปีการศึกษา</label>
              <input
                id="academic-year"
                className="input"
                type="number"
                min={2400}
                max={2700}
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">เพศ</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {GENDERS.map(g => (
                  <label
                    key={g}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem',
                      border: `1px solid ${gender === g ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      borderRadius: 8,
                      backgroundColor: gender === g ? 'var(--color-primary-bg)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 0.875rem', backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)', borderRadius: 8,
              marginBottom: '1rem', color: 'var(--color-error-text)', fontSize: '0.875rem',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  กำลังบันทึก...
                </>
              ) : (
                student ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
