'use client'

import { useState } from 'react'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { addCaseUpdate } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'

interface CaseUpdateModalProps {
  caseId: string
  currentStatus: 'planned' | 'done'
  onClose: () => void
  onSaved: () => void
}

export default function CaseUpdateModal({
  caseId,
  currentStatus,
  onClose,
  onSaved,
}: CaseUpdateModalProps) {
  const { user } = useAuth()
  const [activityNote, setActivityNote] = useState('')
  const [resultNote, setResultNote] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [markDone, setMarkDone] = useState(currentStatus === 'planned')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!activityNote.trim() && !resultNote.trim() && !nextStep.trim()) {
      setError('กรุณากรอกข้อมูลอย่างน้อยหนึ่งช่อง (กิจกรรมที่ทำ, ผลที่ได้ หรือขั้นตอนต่อไป)')
      return
    }

    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อนทำรายการ')
      return
    }

    setSubmitting(true)
    try {
      await addCaseUpdate({
        case_id: caseId,
        caretaker_id: user.id,
        activity_note: activityNote.trim(),
        result_note: resultNote.trim(),
        next_step: nextStep.trim(),
        mark_done: markDone,
      })
      onSaved()
    } catch {
      setError('ไม่สามารถบันทึกการอัปเดตได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>บันทึกความคืบหน้าเคส</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
              โดย: {user?.name}
            </p>
          </div>
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
          {/* Activity note */}
          <div className="form-group">
            <label className="label">สิ่งที่ทำ / กิจกรรมที่ดำเนินการ</label>
            <textarea
              className="textarea"
              rows={3}
              value={activityNote}
              onChange={e => setActivityNote(e.target.value)}
              placeholder="เช่น พูดคุยปรับทุกข์ ให้คำปรึกษาเรื่องการเรียน นัดหมายผู้ปกครอง..."
            />
          </div>

          {/* Result note */}
          <div className="form-group">
            <label className="label">ผลที่ได้จากการพูดคุย / กิจกรรม</label>
            <textarea
              className="textarea"
              rows={3}
              value={resultNote}
              onChange={e => setResultNote(e.target.value)}
              placeholder="เช่น นักเรียนเริ่มเปิดใจ ยิ้มแย้มขึ้น เข้าใจบทเรียนมากขึ้น..."
            />
          </div>

          {/* Next step */}
          <div className="form-group">
            <label className="label">ขั้นตอนต่อไป / นัดหมายครั้งถัดไป</label>
            <textarea
              className="textarea"
              rows={2}
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
              placeholder="เช่น ติดตามผลในอีก 2 สัปดาห์ สังเกตพฤติกรรมในห้องเรียน..."
            />
          </div>

          {/* Mark done checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem',
              borderRadius: 8,
              backgroundColor: markDone ? 'var(--color-done)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              marginBottom: '1.25rem',
              transition: 'background-color 0.2s',
            }}
            onClick={() => setMarkDone(!markDone)}
          >
            <input
              type="checkbox"
              id="markDoneCheckbox"
              checked={markDone}
              onChange={e => setMarkDone(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label
              htmlFor="markDoneCheckbox"
              style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <CheckCircle2 size={16} style={{ color: markDone ? 'var(--color-success-text)' : 'var(--color-text-muted)' }} />
              เปลี่ยนสถานะเคสเป็น &quot;เสร็จสิ้น&quot; (Done)
            </label>
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
              {submitting ? 'กำลังบันทึก...' : 'บันทึกอัปเดต'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
