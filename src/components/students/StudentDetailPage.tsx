'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  FileDown,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Clock,
  PenTool,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  User,
  GraduationCap,
} from 'lucide-react'
import { getStudent, getCasesForStudent, deleteStudent } from '@/lib/queries'
import type { Student, CaseWithDetails } from '@/lib/types'
import { getCaseTypeLabel, getStatusLabel } from '@/lib/types'
import { formatThaiDate, formatThaiDateTime } from '@/lib/dateUtils'
import { exportStudentReportPDF } from '@/lib/pdfExport'
import { exportStudentCasesToExcel } from '@/lib/excelExport'
import StudentFormModal from './StudentFormModal'

interface StudentDetailPageProps {
  studentId: string
}

export default function StudentDetailPage({ studentId }: StudentDetailPageProps) {
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [cases, setCases] = useState<CaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sData, cData] = await Promise.all([
        getStudent(studentId),
        getCasesForStudent(studentId),
      ])
      if (!sData) {
        setError('ไม่พบข้อมูลนักเรียนคนนี้ หรืออาจถูกลบไปแล้ว')
      } else {
        setStudent(sData)
        setCases(cData)
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteStudent(studentId)
      router.push('/students')
    } catch {
      alert('ไม่สามารถลบข้อมูลนักเรียนได้ กรุณาลองใหม่อีกครั้ง')
      setDeleting(false)
    }
  }

  async function handleExportPDF() {
    if (!student) return
    setExportingPDF(true)
    try {
      await exportStudentReportPDF(student, cases)
    } catch (err) {
      console.error(err)
      alert('ไม่สามารถส่งออก PDF ได้')
    } finally {
      setExportingPDF(false)
    }
  }

  function handleExportExcel() {
    if (!student) return
    try {
      exportStudentCasesToExcel(student, cases)
    } catch (err) {
      console.error(err)
      alert('ไม่สามารถส่งออก Excel ได้')
    }
  }

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>กำลังโหลดข้อมูลนักเรียน...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <AlertTriangle size={48} style={{ color: '#ef4444' }} />
        <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>{error || 'ไม่พบนักเรียน'}</p>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '1rem' }}
          onClick={() => router.push('/students')}
        >
          กลับหน้ารายชื่อนักเรียน
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: '1rem', paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => router.push('/students')}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.6rem' }}
        >
          <ArrowLeft size={18} />
          <span>รายชื่อนักเรียน</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleExportPDF}
            className="btn btn-secondary btn-sm"
            disabled={exportingPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            title="ส่งออกรายงาน PDF สรุปทุกเคสของนักเรียน"
          >
            <FileDown size={16} />
            <span>{exportingPDF ? 'กำลังออก...' : 'PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            title="ส่งออก Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden-mobile">Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            aria-label="แก้ไขข้อมูลนักเรียน"
          >
            <Edit2 size={16} />
            <span className="hidden-mobile">แก้ไข</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            aria-label="ลบนักเรียน"
          >
            <Trash2 size={16} />
            <span className="hidden-mobile">ลบ</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {/* Avatar */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: student.gender === 'ชาย' ? '#bfdbfe' : student.gender === 'หญิง' ? '#fbcfe8' : '#e9d5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: student.gender === 'ชาย' ? '#1e40af' : student.gender === 'หญิง' ? '#9d174d' : '#5b21b6',
              flexShrink: 0,
            }}
          >
            {student.first_name_th?.[0] ?? '?'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              {student.first_name_th} {student.last_name_th}
              {student.nickname_th && (
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                  {' '}({student.nickname_th})
                </span>
              )}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              <span>รหัส: <strong style={{ color: 'var(--color-text)' }}>{student.student_id || '-'}</strong></span>
              <span>•</span>
              <span>ระดับชั้น: <strong style={{ color: 'var(--color-text)' }}>{student.grade || '-'}/{student.room || '-'}</strong></span>
              <span>•</span>
              <span>เพศ: <strong style={{ color: 'var(--color-text)' }}>{student.gender || '-'}</strong></span>
            </div>
          </div>
        </div>

        {/* Stats highlight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{cases.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>เคสทั้งหมด</div>
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
              {cases.filter(c => c.status === 'done').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>เสร็จสิ้นแล้ว</div>
          </div>
        </div>
      </div>

      {/* Case History Timeline */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            ประวัติการดูแลรายเคส ({cases.length})
          </h2>
        </div>

        {cases.length === 0 ? (
          <div className="card empty-state" style={{ padding: '2.5rem' }}>
            <GraduationCap size={44} strokeWidth={1.2} style={{ color: 'var(--color-border)' }} />
            <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>ยังไม่มีประวัติเคสสำหรับนักเรียนคนนี้</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              สามารถเพิ่มเคสได้จากหน้าปฏิทินและเลือกนักเรียนคนนี้
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cases.map(c => (
              <button
                key={c.id}
                type="button"
                className="card card-sm animate-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  transition: 'transform 0.1s, border-color 0.2s',
                }}
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                {/* Status indicator bar */}
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
                      {c.status === 'planned' ? (
                        <Clock3 size={11} style={{ marginRight: 3, display: 'inline' }} />
                      ) : (
                        <CheckCircle2 size={11} style={{ marginRight: 3, display: 'inline' }} />
                      )}
                      {getStatusLabel(c.status)}
                    </span>
                    <span className={`badge badge-${c.case_type}`}>
                      {getCaseTypeLabel(c.case_type, c.other_text)}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                    นัดหมาย: {formatThaiDateTime(c.scheduled_at)}
                  </div>

                  {c.details && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '0.375rem', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.details}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.375rem', marginTop: '0.375rem' }}>
                    <span>ผู้ดูแล: {c.caretakers.map(ct => ct.name).join(', ') || '-'}</span>
                    <span>•</span>
                    <span>อัปเดต: {c.updates.length} ครั้ง</span>
                    {c.signatures.length > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <PenTool size={11} /> {c.signatures.length} ลายเซ็น
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {showEditModal && (
        <StudentFormModal
          student={student}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false)
            loadData()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}>
          <div className="modal-panel animate-in" style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>
              ยืนยันการลบข้อมูลนักเรียน
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ <strong>{student.first_name_th} {student.last_name_th}</strong>?
              การกระทำนี้จะลบนักเรียนคนนี้ออกจากระบบ
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
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบนักเรียน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
