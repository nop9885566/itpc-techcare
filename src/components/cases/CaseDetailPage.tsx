'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  FileDown,
  Edit2,
  Trash2,
  Plus,
  PenTool,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from 'lucide-react'
import { getCaseWithDetails, deleteCase, getStudents, getCaretakers } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'
import type { CaseWithDetails, Student, Caretaker } from '@/lib/types'
import { getCaseTypeLabel, getStatusLabel } from '@/lib/types'
import { formatThaiDate, formatThaiDateTime } from '@/lib/dateUtils'
import { exportCasePDF } from '@/lib/pdfExport'
import CaseUpdateModal from './CaseUpdateModal'
import SignatureModal from './SignatureModal'
import CaseFormModal from './CaseFormModal'

interface CaseDetailPageProps {
  caseId: string
}

export default function CaseDetailPage({ caseId }: CaseDetailPageProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Options for edit modal
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [allCaretakers, setAllCaretakers] = useState<Caretaker[]>([])

  const loadCase = useCallback(async () => {
    try {
      const data = await getCaseWithDetails(caseId)
      setError('')
      if (!data) {
        setError('ไม่พบข้อมูลเคสนี้ในระบบ หรืออาจถูกลบไปแล้ว')
      } else {
        setCaseData(data)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลเคสไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    let active = true
    getCaseWithDetails(caseId)
      .then(data => {
        if (!active) return
        setError('')
        if (!data) {
          setError('ไม่พบข้อมูลเคสนี้ในระบบ หรืออาจถูกลบไปแล้ว')
        } else {
          setCaseData(data)
        }
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลเคสไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [caseId])

  // Load auxiliary data for edit modal when needed
  async function handleOpenEdit() {
    try {
      const [sList, cList] = await Promise.all([getStudents(null), getCaretakers()])
      setAllStudents(sList)
      setAllCaretakers(cList)
      setShowEditModal(true)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCase(caseId)
      router.push('/calendar')
    } catch {
      alert('ไม่สามารถลบเคสได้ กรุณาลองใหม่อีกครั้ง')
      setDeleting(false)
    }
  }

  async function handleExportPDF() {
    if (!caseData) return
    setExportingPDF(true)
    try {
      await exportCasePDF(caseData)
    } catch (err) {
      console.error(err)
      alert('ไม่สามารถส่งออก PDF ได้')
    } finally {
      setExportingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>กำลังโหลดข้อมูลเคส...</p>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-error-text)' }} />
        <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>{error || 'ไม่พบเคส'}</p>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '1rem' }}
          onClick={() => router.push('/calendar')}
        >
          กลับหน้าปฏิทิน
        </button>
      </div>
    )
  }

  // Check if current logged-in user is one of the assigned caretakers
  const isCaretakerAssigned = user ? caseData.caretakers.some(c => c.id === user.id) : false

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: '1rem', paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.6rem' }}
        >
          <ArrowLeft size={18} />
          <span>ย้อนกลับ</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleExportPDF}
            className="btn btn-secondary btn-sm"
            disabled={exportingPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <FileDown size={16} />
            <span>{exportingPDF ? 'กำลังออก...' : 'PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEdit}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            aria-label="แก้ไขเคส"
          >
            <Edit2 size={16} />
            <span className="hidden-mobile">แก้ไข</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            aria-label="ลบเคส"
          >
            <Trash2 size={16} />
            <span className="hidden-mobile">ลบ</span>
          </button>
        </div>
      </div>

      {/* Main Case Info Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className={`badge badge-${caseData.status}`}>
            {caseData.status === 'planned' ? (
              <Clock3 size={13} style={{ marginRight: 4, display: 'inline' }} />
            ) : (
              <CheckCircle2 size={13} style={{ marginRight: 4, display: 'inline' }} />
            )}
            {getStatusLabel(caseData.status)}
          </span>
          <span className={`badge badge-${caseData.case_type}`}>
            {getCaseTypeLabel(caseData.case_type, caseData.other_text)}
          </span>
        </div>

        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          {getCaseTypeLabel(caseData.case_type, caseData.other_text)}
        </h1>

        {caseData.details ? (
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
            {caseData.details}
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            ไม่มีรายละเอียดเพิ่มเติม
          </p>
        )}

        {/* Metadata info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
            <span>กำหนดการ: <strong style={{ color: 'var(--color-text)' }}>{formatThaiDateTime(caseData.scheduled_at)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <User size={15} style={{ color: 'var(--color-primary)' }} />
            <span>สร้างโดย: <strong style={{ color: 'var(--color-text)' }}>{caseData.creator?.name || 'ไม่ระบุ'}</strong></span>
          </div>
        </div>
      </div>

      {/* Associated Students Section */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          นักเรียนที่เกี่ยวข้อง ({caseData.students.length} คน)
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {caseData.students.map(s => (
            <button
              key={s.id}
              onClick={() => router.push(`/students/${s.id}`)}
              className="chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '0.4rem 0.75rem',
                borderRadius: 20,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: s.gender === 'ชาย' ? 'var(--color-gender-male)' : s.gender === 'หญิง' ? 'var(--color-gender-female)' : 'var(--color-gender-other)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {s.first_name_th?.[0] ?? '?'}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {s.first_name_th} {s.last_name_th} {s.nickname_th ? `(${s.nickname_th})` : ''} · {s.grade}/{s.room}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Associated Caretakers Section */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <User size={16} style={{ color: 'var(--color-primary)' }} />
          ผู้ดูแลที่รับผิดชอบ ({caseData.caretakers.length} คน)
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {caseData.caretakers.map(ct => (
            <span
              key={ct.id}
              className="chip"
              style={{
                backgroundColor: ct.id === user?.id ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                borderColor: ct.id === user?.id ? 'var(--color-primary)' : 'var(--color-border)',
                color: ct.id === user?.id ? 'var(--color-primary-dark)' : 'var(--color-text)',
                fontWeight: ct.id === user?.id ? 600 : 400,
              }}
            >
              {ct.name} {ct.id === user?.id && '(คุณ)'}
            </span>
          ))}
        </div>
      </div>

      {/* Case Updates Timeline Section */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            ประวัติการอัปเดต ({caseData.updates.length})
          </h2>

          {/* อัปเดตเคส button — only visible to assigned caretakers */}
          {isCaretakerAssigned ? (
            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Plus size={16} />
              <span>อัปเดตเคส</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              (เฉพาะผู้ดูแลที่เกี่ยวข้องเท่านั้น)
            </span>
          )}
        </div>

        {caseData.updates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            ยังไม่มีบันทึกความคืบหน้า
            {isCaretakerAssigned && ' — กดปุ่ม "อัปเดตเคส" เพื่อบันทึกกิจกรรมหรือการพูดคุย'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {caseData.updates.map((u, idx) => (
              <div
                key={u.id}
                style={{
                  padding: '0.875rem',
                  borderRadius: 8,
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    ครั้งที่ {caseData.updates.length - idx} · {u.caretaker?.name || 'ผู้ดูแล'}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {formatThaiDateTime(u.created_at)}
                  </span>
                </div>

                {u.activity_note && (
                  <div style={{ marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                    <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>สิ่งที่ทำ:</strong>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{u.activity_note}</span>
                  </div>
                )}

                {u.result_note && (
                  <div style={{ marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                    <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>ผลที่ได้:</strong>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{u.result_note}</span>
                  </div>
                )}

                {u.next_step && (
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>ขั้นตอนต่อไป:</strong>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{u.next_step}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signatures Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <PenTool size={16} style={{ color: 'var(--color-primary)' }} />
            ลายเซ็น ({caseData.signatures.length})
          </h2>

          <button
            type="button"
            onClick={() => setShowSignatureModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Plus size={16} />
            <span>เซ็นชื่อ</span>
          </button>
        </div>

        {caseData.signatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            ยังไม่มีลายเซ็น — สามารถให้นักเรียน ผู้ปกครอง หรือครูเซ็นรับทราบได้
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {caseData.signatures.map(sig => (
              <div
                key={sig.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '0.625rem',
                  backgroundColor: 'var(--color-surface)',
                  textAlign: 'center',
                }}
              >
                <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-alt)', borderRadius: 4, marginBottom: '0.5rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sig.signature_data}
                    alt={`ลายเซ็น ${sig.signer_name}`}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{sig.signer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  ({sig.signer_role}) · {formatThaiDate(sig.signed_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <CaseUpdateModal
          caseId={caseData.id}
          currentStatus={caseData.status}
          onClose={() => setShowUpdateModal(false)}
          onSaved={() => {
            setShowUpdateModal(false)
            loadCase()
          }}
        />
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          caseId={caseData.id}
          onClose={() => setShowSignatureModal(false)}
          onSaved={() => {
            setShowSignatureModal(false)
            loadCase()
          }}
        />
      )}

      {/* Edit Case Modal */}
      {showEditModal && (
        <CaseFormModal
          students={allStudents}
          caretakers={allCaretakers}
          initialCase={caseData}
          onClose={() => setShowEditModal(false)}
          onCreated={() => {
            setShowEditModal(false)
            loadCase()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}>
          <div className="modal-panel animate-in" style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-error-text)' }}>
              ยืนยันการลบเคส
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบเคสนี้? ข้อมูลการอัปเดตและลายเซ็นที่เกี่ยวข้องทั้งหมดจะถูกลบออกอย่างถาวรและไม่สามารถกู้คืนได้
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบเคส'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
