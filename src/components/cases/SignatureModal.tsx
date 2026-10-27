'use client'

import { useState, useRef } from 'react'
import { X, RotateCcw, Check, AlertCircle } from 'lucide-react'
import SignaturePad, { SignaturePadHandle } from './SignaturePad'
import { addSignature } from '@/lib/queries'

interface SignatureModalProps {
  caseId: string
  onClose: () => void
  onSaved: () => void
}

const SIGNER_ROLES = ['นักเรียน', 'ผู้ปกครอง', 'ครูที่ปรึกษา', 'ผู้ดูแล', 'อื่นๆ']

export default function SignatureModal({ caseId, onClose, onSaved }: SignatureModalProps) {
  const padRef = useRef<SignaturePadHandle>(null)
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState('นักเรียน')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!signerName.trim()) {
      setError('กรุณากรอกชื่อผู้เซ็น')
      return
    }
    if (padRef.current?.isEmpty()) {
      setError('กรุณาวาดลายเซ็นก่อนบันทึก')
      return
    }

    setSubmitting(true)
    try {
      const dataUrl = padRef.current!.toDataURL()
      await addSignature({
        case_id: caseId,
        signer_name: signerName.trim(),
        signer_role: signerRole,
        signature_data: dataUrl,
      })
      onSaved()
    } catch {
      setError('ไม่สามารถบันทึกลายเซ็นได้ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>เพิ่มลายเซ็น</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 36, padding: '0.35rem', width: 36, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="signer-name">ชื่อผู้เซ็น <span style={{ color: 'var(--color-error-text)' }}>*</span></label>
          <input
            id="signer-name"
            className="input"
            type="text"
            placeholder="กรอกชื่อ-นามสกุล"
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="signer-role">บทบาท</label>
          <select
            id="signer-role"
            className="input"
            value={signerRole}
            onChange={e => setSignerRole(e.target.value)}
          >
            {SIGNER_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label className="label" style={{ margin: 0 }}>ลายเซ็น <span style={{ color: 'var(--color-error-text)' }}>*</span></label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => padRef.current?.clear()}
              style={{ fontSize: '0.8rem', gap: '0.25rem' }}
            >
              <RotateCcw size={14} />
              ล้าง
            </button>
          </div>
          <SignaturePad ref={padRef} height={180} />
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '0.375rem' }}>
            วาดลายเซ็นด้วยนิ้วหรือเมาส์
          </p>
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={submitting}
            style={{ flex: 2 }}
          >
            {submitting ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Check size={16} />
                บันทึกลายเซ็น
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
