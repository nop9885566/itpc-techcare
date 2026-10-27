'use server'

import { createSession, clearSession, getCurrentUser, requireAdmin, requireUser } from '@/lib/serverSession'
import { getSupabaseClient } from '@/lib/supabase'
import type {
  Student,
  Caretaker,
  Case,
  CaseWithDetails,
  CalendarCase,
  StudentWithCaseCount,
  CaseUpdate,
  CaseSignature,
  AuthUser,
  UserRole,
} from '@/lib/types'

function currentAcademicYear(): number {
  return new Date().getFullYear() + 543
}

function throwRpcError(data: { success?: boolean; error?: string } | null, fallback: string): void {
  if (!data?.success) throw new Error(data?.error || fallback)
}

interface CaseDetailsRow extends Case {
  caretakers: Caretaker
  case_students: { student_id: string; students: Student | null }[]
  case_caretakers: { caretaker_id: string; caretakers: Caretaker | null }[]
  case_updates: (CaseUpdate & { caretakers: Caretaker | null })[]
  case_signatures: CaseSignature[]
}

interface CalendarCaseRow extends Case {
  creator: Caretaker
  case_students: { student_id: string; students: Student | null }[]
  case_caretakers: { caretaker_id: string; caretakers: Caretaker | null }[]
  case_updates: (CaseUpdate & { caretakers: Caretaker | null })[]
  case_signatures: CaseSignature[]
}

interface StudentCaseRelationRow {
  cases: CaseDetailsRow | CaseDetailsRow[] | null
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function mapUpdates(rows: (CaseUpdate & { caretakers: Caretaker | null })[]) {
  return rows.map(({ caretakers, ...update }) => {
    if (!caretakers) throw new Error('ไม่พบข้อมูลผู้บันทึกการติดตาม')
    return { ...update, caretaker: caretakers }
  })
}

function mapCaseDetails(row: CaseDetailsRow): CaseWithDetails {
  return {
    ...row,
    creator: row.caretakers,
    students: row.case_students
      .map((relation) => relation.students)
      .filter((student): student is Student => Boolean(student && !student.disabled_at)),
    caretakers: row.case_caretakers
      .map((relation) => relation.caretakers)
      .filter(isPresent),
    updates: mapUpdates(row.case_updates),
    signatures: row.case_signatures,
  }
}

// ===== AUTH =====

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  return getCurrentUser()
}

export async function loginCaretaker(
  name: string,
  pin: string
): Promise<{ success: boolean; caretaker?: AuthUser; error?: string }> {
  if (!name.trim() || !/^\d{4,6}$/.test(pin)) {
    return { success: false, error: 'กรุณากรอกชื่อและ PIN ตัวเลข 4–6 หลัก' }
  }

  const { data, error } = await (await getSupabaseClient({ anonymous: true })).rpc('login_caretaker', {
    p_name: name.trim(),
    p_pin: pin,
  })
  if (error) throw error

  const result = data as {
    success: boolean
    caretaker?: AuthUser
    session_token?: string
    error?: string
  }
  if (!result.success || !result.caretaker || !result.session_token) {
    return { success: false, error: result.error || 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง' }
  }

  await createSession(result.session_token)
  return { success: true, caretaker: result.caretaker }
}

export async function logoutCaretaker(): Promise<void> {
  await clearSession()
}

export async function updateOwnProfile(name: string, pin?: string): Promise<AuthUser> {
  const user = await requireUser()
  const { data, error } = await (await getSupabaseClient()).rpc('update_caretaker_profile', {
    p_id: user.id,
    p_name: name.trim(),
    p_pin: pin || null,
  })
  if (error) throw error
  throwRpcError(data as { success?: boolean; error?: string }, 'ไม่สามารถแก้ไขข้อมูลส่วนตัวได้')
  return { ...user, name: name.trim() }
}

// ===== STUDENTS =====

export async function getStudents(academicYear: number | null = currentAcademicYear()): Promise<Student[]> {
  await requireUser()
  let query = (await getSupabaseClient())
    .from('students')
    .select('*')
    .is('disabled_at', null)
    .order('grade')
    .order('room')
    .order('first_name_th')
  if (academicYear !== null) query = query.eq('academic_year', academicYear)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudentsWithCaseCount(): Promise<StudentWithCaseCount[]> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('students')
    .select('*, case_students(count)')
    .is('disabled_at', null)
    .order('academic_year', { ascending: false })
    .order('grade')
    .order('room')
    .order('first_name_th')
  if (error) throw error
  return (data ?? []).map((student) => ({
    ...student,
    case_count: student.case_students?.[0]?.count ?? 0,
  }))
}

export async function getStudent(id: string): Promise<Student | null> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('students')
    .select('*')
    .eq('id', id)
    .is('disabled_at', null)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createStudent(
  student: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'disabled_at'>
): Promise<Student> {
  await requireAdmin()
  const { data, error } = await (await getSupabaseClient())
    .from('students')
    .insert({ ...student, academic_year: student.academic_year || currentAcademicYear() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateStudent(
  id: string,
  updates: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at' | 'disabled_at'>>
): Promise<Student> {
  await requireAdmin()
  const { data, error } = await (await getSupabaseClient())
    .from('students')
    .update(updates)
    .eq('id', id)
    .is('disabled_at', null)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStudent(id: string): Promise<void> {
  await requireAdmin()
  const { error } = await (await getSupabaseClient())
    .from('students')
    .update({ disabled_at: new Date().toISOString() })
    .eq('id', id)
    .is('disabled_at', null)
  if (error) throw error
}

// ===== CARETAKERS =====

export async function getCaretakers(): Promise<Caretaker[]> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('caretakers')
    .select('id, name, role, disabled_at, created_at')
    .is('disabled_at', null)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getCaretakerAccounts(): Promise<Caretaker[]> {
  await requireAdmin()
  const { data, error } = await (await getSupabaseClient())
    .from('caretakers')
    .select('id, name, role, disabled_at, created_at')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function manageCaretaker(params: {
  id?: string
  name: string
  pin?: string
  role: UserRole
}): Promise<void> {
  await requireAdmin()
  const { data, error } = await (await getSupabaseClient()).rpc('manage_caretaker', {
    p_id: params.id ?? null,
    p_name: params.name.trim(),
    p_pin: params.pin || null,
    p_role: params.role,
  })
  if (error) throw error
  throwRpcError(data as { success?: boolean; error?: string }, 'ไม่สามารถบันทึกบัญชีได้')
}

export async function setCaretakerDisabled(id: string, disabled: boolean): Promise<void> {
  const user = await requireAdmin()
  if (user.id === id && disabled) {
    throw new Error('ไม่สามารถปิดบัญชีที่กำลังใช้งานอยู่ได้')
  }

  const { data, error } = await (await getSupabaseClient()).rpc('set_caretaker_disabled', {
    p_id: id,
    p_disabled: disabled,
  })
  if (error) throw error
  throwRpcError(data as { success?: boolean; error?: string }, 'ไม่สามารถเปลี่ยนสถานะบัญชีได้')
}

// ===== CASES =====

export async function createCaseFull(params: {
  case_type: string
  other_text: string | null
  details: string | null
  scheduled_at: string | null
  created_by: string
  student_ids: string[]
  caretaker_ids: string[]
}): Promise<{ success: boolean; case_id?: string; error?: string }> {
  const user = await requireUser()
  const { data, error } = await (await getSupabaseClient()).rpc('create_case_full', {
    p_case_type: params.case_type,
    p_other_text: params.other_text,
    p_details: params.details,
    p_scheduled_at: params.scheduled_at,
    p_created_by: user.id,
    p_student_ids: params.student_ids,
    p_caretaker_ids: params.caretaker_ids,
  })
  if (error) return { success: false, error: error.message }
  return data as { success: boolean; case_id?: string; error?: string }
}

export async function updateCaseFull(params: {
  case_id: string
  case_type: string
  other_text: string | null
  details: string | null
  scheduled_at: string | null
  status: string
  student_ids: string[]
  caretaker_ids: string[]
}): Promise<{ success: boolean; error?: string }> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient()).rpc('update_case_full', {
    p_case_id: params.case_id,
    p_case_type: params.case_type,
    p_other_text: params.other_text,
    p_details: params.details,
    p_scheduled_at: params.scheduled_at,
    p_status: params.status,
    p_student_ids: params.student_ids,
    p_caretaker_ids: params.caretaker_ids,
  })
  if (error) return { success: false, error: error.message }
  return data as { success: boolean; error?: string }
}

export async function deleteCase(id: string): Promise<void> {
  await requireUser()
  const { error } = await (await getSupabaseClient()).from('cases').delete().eq('id', id)
  if (error) throw error
}

export async function getCasesForCalendar(
  caretakerId?: string | null
): Promise<CalendarCase[]> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('cases')
    .select(`
      *,
      creator:caretakers!cases_created_by_fkey(id, name, role, disabled_at, created_at),
      case_students(student_id, students(*)),
      case_caretakers(caretaker_id, caretakers(id, name, role, disabled_at, created_at)),
      case_updates(*, caretakers(id, name, role, disabled_at, created_at)),
      case_signatures(*)
    `)
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as CalendarCaseRow[]
  const cases: CalendarCase[] = rows.map((item) => ({
    ...item,
    students: (item.case_students ?? [])
      .map((relation) => relation.students)
      .filter((student): student is Student => Boolean(student && !student.disabled_at)),
    caretakers: (item.case_caretakers ?? [])
      .map((relation) => relation.caretakers)
      .filter(isPresent),
    updates: mapUpdates(item.case_updates),
    signatures: item.case_signatures ?? [],
  }))

  if (caretakerId) {
    return cases.filter((item) => item.caretakers.some((caretaker) => caretaker.id === caretakerId))
  }
  return cases
}

export async function getCaseWithDetails(id: string): Promise<CaseWithDetails | null> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('cases')
    .select(`
      *,
      caretakers!cases_created_by_fkey(id, name, role, disabled_at, created_at),
      case_students(student_id, students(*)),
      case_caretakers(caretaker_id, caretakers(id, name, role, disabled_at, created_at)),
      case_updates(*, caretakers(id, name, role, disabled_at, created_at)),
      case_signatures(*)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapCaseDetails(data as CaseDetailsRow)
}

export async function getCasesForStudent(studentId: string): Promise<CaseWithDetails[]> {
  await requireUser()
  const supabase = await getSupabaseClient()
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .is('disabled_at', null)
    .maybeSingle()
  if (studentError) throw studentError
  if (!student) return []

  const { data, error } = await supabase
    .from('case_students')
    .select(`
      cases(
        *,
        caretakers!cases_created_by_fkey(id, name, role, disabled_at, created_at),
        case_students(student_id, students(*)),
        case_caretakers(caretaker_id, caretakers(id, name, role, disabled_at, created_at)),
        case_updates(*, caretakers(id, name, role, disabled_at, created_at)),
        case_signatures(*)
      )
    `)
    .eq('student_id', studentId)
    .order('cases(scheduled_at)', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as StudentCaseRelationRow[]
  const relatedCases = rows.flatMap((row) =>
    Array.isArray(row.cases) ? row.cases : row.cases ? [row.cases] : []
  )
  return relatedCases.map(mapCaseDetails)
}

// ===== CASE UPDATES =====

export async function addCaseUpdate(params: {
  case_id: string
  caretaker_id: string
  activity_note: string
  result_note: string
  next_step: string
  mark_done: boolean
}): Promise<CaseUpdate> {
  const user = await requireUser()
  const supabase = await getSupabaseClient()
  const { data: update, error: updateError } = await supabase
    .from('case_updates')
    .insert({
      case_id: params.case_id,
      caretaker_id: user.id,
      activity_note: params.activity_note || null,
      result_note: params.result_note || null,
      next_step: params.next_step || null,
    })
    .select()
    .single()
  if (updateError) throw updateError

  if (params.mark_done) {
    const { error } = await supabase
      .from('cases')
      .update({ status: 'done' })
      .eq('id', params.case_id)
    if (error) throw error
  }
  return update
}

// ===== SIGNATURES =====

export async function addSignature(params: {
  case_id: string
  signer_name: string
  signer_role: string
  signature_data: string
}): Promise<CaseSignature> {
  await requireUser()
  const { data, error } = await (await getSupabaseClient())
    .from('case_signatures')
    .insert(params)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSignature(id: string): Promise<void> {
  await requireUser()
  const { error } = await (await getSupabaseClient()).from('case_signatures').delete().eq('id', id)
  if (error) throw error
}
