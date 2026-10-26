// Database type definitions for ITPC Techcare

export type CaseType = 'low_confidence' | 'feel_not_smart' | 'other'
export type CaseStatus = 'planned' | 'done'
export type Gender = 'ชาย' | 'หญิง' | 'ไม่ระบุ'

export interface Student {
  id: string
  student_id: string | null
  first_name_th: string | null
  last_name_th: string | null
  nickname_th: string | null
  grade: string | null
  room: number | null
  gender: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Caretaker {
  id: string
  name: string
  created_at: string
}

export interface Case {
  id: string
  case_type: CaseType
  other_text: string | null
  details: string | null
  scheduled_at: string | null
  status: CaseStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface CaseStudent {
  case_id: string
  student_id: string
}

export interface CaseCaretaker {
  case_id: string
  caretaker_id: string
}

export interface CaseUpdate {
  id: string
  case_id: string
  caretaker_id: string
  activity_note: string | null
  result_note: string | null
  next_step: string | null
  created_at: string
}

export interface CaseSignature {
  id: string
  case_id: string
  signer_name: string
  signer_role: string
  signature_data: string
  signed_at: string
}

// Enriched types for UI display
export interface CaseWithDetails extends Case {
  students: Student[]
  caretakers: Caretaker[]
  updates: (CaseUpdate & { caretaker: Caretaker })[]
  signatures: CaseSignature[]
  creator: Caretaker
}

export interface StudentWithCaseCount extends Student {
  case_count: number
}

export interface CalendarCase extends Case {
  students: Student[]
  caretakers: Caretaker[]
}

// Auth types (stored in localStorage)
export interface AuthUser {
  id: string
  name: string
}

// Form types
export interface CreateCaseForm {
  case_type: CaseType
  other_text: string
  details: string
  scheduled_at: string
  student_ids: string[]
  caretaker_ids: string[]
}

export interface UpdateCaseForm {
  activity_note: string
  result_note: string
  next_step: string
  mark_done: boolean
}

export interface CaseTypeLabel {
  value: CaseType
  label: string
}

export const CASE_TYPE_LABELS: CaseTypeLabel[] = [
  { value: 'low_confidence', label: 'นักเรียนไม่มั่นใจในตัวเอง' },
  { value: 'feel_not_smart', label: 'นักเรียนรู้สึกว่าตัวเองเรียนไม่เก่ง' },
  { value: 'other', label: 'อื่นๆ' },
]

export function getCaseTypeLabel(type: CaseType, otherText?: string | null): string {
  if (type === 'other' && otherText) return otherText
  return CASE_TYPE_LABELS.find(t => t.value === type)?.label ?? type
}

export function getStatusLabel(status: CaseStatus): string {
  return status === 'planned' ? 'กำหนดการ' : 'เสร็จสิ้น'
}
