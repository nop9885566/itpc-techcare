'use server'

import { supabase } from '@/lib/supabase'
import type {
  Student,
  Caretaker,
  Case,
  CaseWithDetails,
  CalendarCase,
  StudentWithCaseCount,
  CaseUpdate,
  CaseSignature,
} from '@/lib/types'

// ===== AUTH =====

export async function loginCaretaker(
  name: string,
  pin: string
): Promise<{ success: boolean; caretaker?: { id: string; name: string }; error?: string }> {
  const { data, error } = await supabase.rpc('login_caretaker', {
    p_name: name,
    p_pin: pin,
  })
  if (error) return { success: false, error: error.message }
  return data as { success: boolean; caretaker?: { id: string; name: string }; error?: string }
}

// ===== STUDENTS =====

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('grade')
    .order('room')
    .order('first_name_th')
  if (error) throw error
  return data ?? []
}

export async function getStudentsWithCaseCount(): Promise<StudentWithCaseCount[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*, case_students(count)')
    .order('grade')
    .order('room')
    .order('first_name_th')
  if (error) throw error
  return (data ?? []).map((s: any) => ({
    ...s,
    case_count: s.case_students?.[0]?.count ?? 0,
  }))
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function createStudent(
  student: Omit<Student, 'id' | 'created_at' | 'updated_at'>
): Promise<Student> {
  const { data, error } = await supabase.from('students').insert(student).select().single()
  if (error) throw error
  return data
}

export async function updateStudent(
  id: string,
  updates: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

// ===== CARETAKERS =====

export async function getCaretakers(): Promise<Caretaker[]> {
  const { data, error } = await supabase
    .from('caretakers')
    .select('id, name, created_at')
    .order('name')
  if (error) throw error
  return data ?? []
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
  const { data, error } = await supabase.rpc('create_case_full', {
    p_case_type: params.case_type,
    p_other_text: params.other_text,
    p_details: params.details,
    p_scheduled_at: params.scheduled_at,
    p_created_by: params.created_by,
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
  const { data, error } = await supabase.rpc('update_case_full', {
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
  const { error } = await supabase.from('cases').delete().eq('id', id)
  if (error) throw error
}

export async function getCasesForCalendar(
  caretakerId?: string | null
): Promise<CalendarCase[]> {
  let query = supabase
    .from('cases')
    .select(`
      *,
      case_students(student_id, students(*)),
      case_caretakers(caretaker_id, caretakers(id, name, created_at))
    `)
    .order('scheduled_at', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  const cases = (data ?? []).map((c: any) => ({
    ...c,
    students: c.case_students?.map((cs: any) => cs.students).filter(Boolean) ?? [],
    caretakers: c.case_caretakers?.map((cc: any) => cc.caretakers).filter(Boolean) ?? [],
  }))

  if (caretakerId) {
    return cases.filter((c: CalendarCase) =>
      c.caretakers.some(ct => ct.id === caretakerId)
    )
  }

  return cases
}

export async function getCaseWithDetails(id: string): Promise<CaseWithDetails | null> {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      caretakers!cases_created_by_fkey(id, name, created_at),
      case_students(student_id, students(*)),
      case_caretakers(caretaker_id, caretakers(id, name, created_at)),
      case_updates(*, caretakers(id, name, created_at)),
      case_signatures(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    ...data,
    creator: data.caretakers,
    students: data.case_students?.map((cs: any) => cs.students).filter(Boolean) ?? [],
    caretakers: data.case_caretakers?.map((cc: any) => cc.caretakers).filter(Boolean) ?? [],
    updates: (data.case_updates ?? []).map((u: any) => ({
      ...u,
      caretaker: u.caretakers,
    })),
    signatures: data.case_signatures ?? [],
  }
}

export async function getCasesForStudent(studentId: string): Promise<CaseWithDetails[]> {
  const { data, error } = await supabase
    .from('case_students')
    .select(`
      cases(
        *,
        caretakers!cases_created_by_fkey(id, name, created_at),
        case_students(student_id, students(*)),
        case_caretakers(caretaker_id, caretakers(id, name, created_at)),
        case_updates(*, caretakers(id, name, created_at)),
        case_signatures(*)
      )
    `)
    .eq('student_id', studentId)
    .order('cases(scheduled_at)', { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((row: any) => row.cases)
    .filter(Boolean)
    .map((c: any) => ({
      ...c,
      creator: c.caretakers,
      students: c.case_students?.map((cs: any) => cs.students).filter(Boolean) ?? [],
      caretakers: c.case_caretakers?.map((cc: any) => cc.caretakers).filter(Boolean) ?? [],
      updates: (c.case_updates ?? []).map((u: any) => ({ ...u, caretaker: u.caretakers })),
      signatures: c.case_signatures ?? [],
    }))
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
  const { data: update, error: updateError } = await supabase
    .from('case_updates')
    .insert({
      case_id: params.case_id,
      caretaker_id: params.caretaker_id,
      activity_note: params.activity_note || null,
      result_note: params.result_note || null,
      next_step: params.next_step || null,
    })
    .select()
    .single()

  if (updateError) throw updateError

  if (params.mark_done) {
    await supabase.from('cases').update({ status: 'done' }).eq('id', params.case_id)
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
  const { data, error } = await supabase.from('case_signatures').insert(params).select().single()
  if (error) throw error
  return data
}

export async function deleteSignature(id: string): Promise<void> {
  const { error } = await supabase.from('case_signatures').delete().eq('id', id)
  if (error) throw error
}
