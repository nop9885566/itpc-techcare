'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import type { Student, Caretaker, CaseType, CaseWithDetails } from '@/lib/types'
import { CASE_TYPE_LABELS } from '@/lib/types'
import { createCaseFull, updateCaseFull } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'
import StudentPicker from './StudentPicker'
import { toISODateTimeLocal } from '@/lib/dateUtils'

interface CaseFormModalProps {
  students: Student[]
  caretakers: Caretaker[]
  initialCase?: CaseWithDetails
  onClose: () => void
  onCreated: () => void
}

export default function CaseFormModal({
  students,
  caretakers,
  initialCase,
  onClose,
  onCreated,
}: CaseFormModalProps) {
  const { user } = useAuth()
  const isEditing = !!initialCase

  const [caseType, setCaseType] = useState<CaseType>(initialCase?.case_type ?? 'low_confidence')
  const [otherText, setOtherText] = useState(initialCase?.other_text ?? '')
  const [details, setDetails] = useState(initialCase?.details ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    initialCase?.scheduled_at
      ? toISODateTimeLocal(new Date(initialCase.scheduled_at))
      : toISODateTimeLocal(new Date())
  )
  const [status, setStatus] = useState<'planned' | 'done'>(initialCase?.status ?? 'planned')
  const [studentIds, setStudentIds] = useState<string[]>(
    initialCase ? initialCase.students.map(s => s.id) : []
  )
  const [caretakerIds, setCaretakerIds] = useState<string[]>(
    initialCase
      ? initialCase.caretakers.map(c => c.id)
      : user
      ? [user.id]
      : []
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleCaretaker(id: string) {
    setCaretakerIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (studentIds.length === 0) {
      setError('กรุณาเลือกนักเรียนอย่างน้อย 1 คน')
      return
    }
    if (caseType === 'other' && !otherText.trim()) {
      setError('กรุณาระบุรายละเอียดสำหรับประเภท "อื่นๆ"')
      return
    }
    if (caretakerIds.length === 0) {
      setError('กรุณาเลือกผู้ดูแลอย่างน้อย 1 คน')
      return
    }

    setSubmitting(true)
    try {
      if (isEditing && initialCase) {
        const result = await updateCaseFull({
          case_id: initialCase.id,
          case_type: caseType,
          other_text: caseType === 'other' ? otherText.trim() : null,
          details: details.trim() || null,
          scheduled_at: scheduledAt || null,
          status,
          student_ids: studentIds,
          caretaker_ids: Array.from(new Set(caretakerIds)),
        })

        if (result.success) {
          onCreated()
        } else {
          setError(result.error ?? 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่')
        }
      } else {
        const result = await createCaseFull({
          case_type: caseType,
          other_text: caseType === 'other' ? otherText.trim() : null,
          details: details.trim() || null,
          scheduled_at: scheduledAt || null,
          created_by: user!.id,
          student_ids: studentIds,
          caretaker_ids: Array.from(new Set([...caretakerIds, user!.id])),
        })

        if (result.success) {
          onCreated()
        } else {
          setError(result.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
      }
    } catch {
      setError('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel animate-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {isEditing ? 'แก้ไขข้อมูลเคส' : 'เพิ่มเคสใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 36, padding: '0.35rem', width: 36, borderRadius: '50%' }}
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Students */}
          <div className="form-group">
            <label className="label">นักเรียน <span style={{ color: '#dc2626' }}>*</span></label>
            <StudentPicker
              students={students}
              selectedIds={studentIds}
              onChange={setStudentIds}
            />
          </div>

          {/* Case type */}
          <div className="form-group">
            <label className="label">ประเภทเคส <span style={{ color: '#dc2626' }}>*</span></label>
            <div className="radio-group">
              {CASE_TYPE_LABELS.map(opt => (
                <label key={opt.value} className="radio-option">
                  <input
                    type="radio"
                    name="caseType"
                    value={opt.value}
                    checked={caseType === opt.value}
                    onChange={() => setCaseType(opt.value)}
                  />
                  <span style={{ fontSize: '0.9375rem' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other text (conditional) */}
          {caseType === 'other' && (
            <div className="form-group">
              <label className="label">ระบุประเภทเคส <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                className="input"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder="เช่น ปัญหาความเครียดจากการแข่งขัน, สมาธิสั้น..."
                required
              />
            </div>
          )}

          {/* Details */}
          <div className="form-group">
            <label className="label">รายละเอียดเพิ่มเติม</label>
            <textarea
              className="textarea"
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="พฤติกรรมที่สังเกตเห็น สิ่งที่ต้องการช่วยเหลือ หรือข้อสังเกต..."
            />
          </div>

          {/* Scheduled at */}
          <div className="form-group">
            <label className="label">วัน-เวลาที่นัดหมาย / ดำเนินการ</label>
            <input
              type="datetime-local"
              className="input"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Status (Only in edit mode) */}
          {isEditing && (
            <div className="form-group">
              <label className="label">สถานะเคส</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label className="radio-option" style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="caseStatus"
                    value="planned"
                    checked={status === 'planned'}
                    onChange={() => setStatus('planned')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>รอดำเนินการ (Planned)</span>
                </label>
                <label className="radio-option" style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="caseStatus"
                    value="done"
                    checked={status === 'done'}
                    onChange={() => setStatus('done')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>เสร็จสิ้น (Done)</span>
                </label>
              </div>
            </div>
          )}

          {/* Caretakers */}
          <div className="form-group">
            <label className="label">ผู้ดูแลที่เกี่ยวข้อง (เลือกได้มากกว่า 1 คน) <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {caretakers.map(ct => {
                const isSelected = caretakerIds.includes(ct.id)
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => toggleCaretaker(ct.id)}
                    className="chip"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                    {ct.name}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'บันทึกเคส'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
