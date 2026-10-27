import * as XLSX from 'xlsx'
import type { CaseWithDetails, Student, CalendarCase } from '@/lib/types'
import { formatThaiDate, formatThaiDateTime } from '@/lib/dateUtils'
import { getCaseTypeLabel, getStatusLabel } from '@/lib/types'

function sortedByDate<T extends { scheduled_at: string | null; created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = new Date(a.scheduled_at ?? a.created_at).getTime()
    const bDate = new Date(b.scheduled_at ?? b.created_at).getTime()
    return bDate - aDate
  })
}

function filenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: Record<string, string | number>[],
  widths: number[]
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ รายการ: 'ไม่มีข้อมูล' }])
  worksheet['!cols'] = widths.map(wch => ({ wch }))
  worksheet['!autofilter'] = { ref: worksheet['!ref'] ?? 'A1:A1' }
  XLSX.utils.book_append_sheet(workbook, worksheet, name)
}

function studentCaseRows(cases: CaseWithDetails[]) {
  return sortedByDate(cases).map((caseData, index) => ({
    'ลำดับ': index + 1,
    'รหัสเคส': caseData.id,
    'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
    'สถานะ': getStatusLabel(caseData.status),
    'วัน-เวลานัด': formatThaiDateTime(caseData.scheduled_at),
    'รายละเอียด': caseData.details || '-',
    'นักเรียนร่วมเคส': caseData.students
      .map(student => `${student.first_name_th ?? ''} ${student.last_name_th ?? ''} (${student.student_id || '-'})`.trim())
      .join(', ') || '-',
    'ผู้ดูแล': caseData.caretakers.map(caretaker => caretaker.name).join(', ') || '-',
    'ผู้สร้างเคส': caseData.creator?.name || '-',
    'จำนวนการอัปเดต': caseData.updates.length,
    'จำนวนลายเซ็น': caseData.signatures.length,
    'วันที่สร้าง': formatThaiDateTime(caseData.created_at),
    'แก้ไขล่าสุด': formatThaiDateTime(caseData.updated_at),
  }))
}

function updateRows(cases: CaseWithDetails[]) {
  return cases
    .flatMap(caseData => caseData.updates.map(update => ({
      createdAt: update.created_at,
      row: {
        'รหัสเคส': caseData.id,
        'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
        'วัน-เวลาบันทึก': formatThaiDateTime(update.created_at),
        'ผู้บันทึก': update.caretaker?.name || '-',
        'กิจกรรม': update.activity_note || '-',
        'ผลการติดตาม': update.result_note || '-',
        'ขั้นตอนถัดไป': update.next_step || '-',
      },
    })))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(item => item.row)
}

function signatureRows(cases: CaseWithDetails[]) {
  return cases.flatMap(caseData => caseData.signatures.map(signature => ({
    'รหัสเคส': caseData.id,
    'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
    'ชื่อผู้ลงนาม': signature.signer_name,
    'บทบาทผู้ลงนาม': signature.signer_role,
    'วัน-เวลาที่ลงนาม': formatThaiDateTime(signature.signed_at),
    'มีภาพลายเซ็น': signature.signature_data ? 'มี' : 'ไม่มี',
  })))
}

function studentSheet(student: Student): Record<string, string | number>[] {
  return [
    { 'ข้อมูล': 'รหัสนักเรียน', 'รายละเอียด': student.student_id || '-' },
    { 'ข้อมูล': 'ชื่อ-นามสกุล', 'รายละเอียด': `${student.first_name_th ?? ''} ${student.last_name_th ?? ''}`.trim() || '-' },
    { 'ข้อมูล': 'ชื่อเล่น', 'รายละเอียด': student.nickname_th || '-' },
    { 'ข้อมูล': 'ระดับชั้น/ห้อง', 'รายละเอียด': `${student.grade || '-'}/${student.room ?? '-'}` },
    { 'ข้อมูล': 'เพศ', 'รายละเอียด': student.gender || '-' },
    { 'ข้อมูล': 'ปีการศึกษา', 'รายละเอียด': student.academic_year },
    { 'ข้อมูล': 'วันที่เพิ่มข้อมูล', 'รายละเอียด': formatThaiDateTime(student.created_at) },
  ]
}

export function exportStudentCasesToExcel(student: Student, cases: CaseWithDetails[]) {
  const workbook = XLSX.utils.book_new()
  appendSheet(workbook, 'ข้อมูลนักเรียน', studentSheet(student), [24, 42])
  appendSheet(workbook, 'ประวัติเคส', studentCaseRows(cases), [8, 38, 30, 14, 24, 48, 42, 30, 24, 16, 16, 24, 24])
  appendSheet(workbook, 'การติดตาม', updateRows(cases), [38, 30, 24, 24, 48, 48, 48])
  appendSheet(workbook, 'ผู้ลงนาม', signatureRows(cases), [38, 30, 28, 22, 24, 18])

  const studentName = filenamePart(`${student.first_name_th ?? 'นักเรียน'}_${student.last_name_th ?? ''}`)
  XLSX.writeFile(
    workbook,
    `ประวัติ_${studentName}_ปี${student.academic_year}_${filenamePart(formatThaiDate(new Date().toISOString()))}.xlsx`
  )
}

function calendarCaseRows(cases: CalendarCase[]) {
  return sortedByDate(cases).map((caseData, index) => ({
    'ลำดับ': index + 1,
    'รหัสเคส': caseData.id,
    'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
    'สถานะ': getStatusLabel(caseData.status),
    'วัน-เวลานัด': formatThaiDateTime(caseData.scheduled_at),
    'นักเรียน': caseData.students
      .map(student => `${student.first_name_th ?? ''} ${student.last_name_th ?? ''} (${student.student_id || '-'}, ${student.grade || '-'}/${student.room ?? '-'})`.trim())
      .join(', ') || '-',
    'ผู้ดูแล': caseData.caretakers.map(caretaker => caretaker.name).join(', ') || '-',
    'ผู้สร้างเคส': caseData.creator?.name || '-',
    'รายละเอียด': caseData.details || '-',
    'จำนวนการอัปเดต': caseData.updates.length,
    'จำนวนลายเซ็น': caseData.signatures.length,
    'วันที่สร้าง': formatThaiDateTime(caseData.created_at),
    'แก้ไขล่าสุด': formatThaiDateTime(caseData.updated_at),
  }))
}

function calendarUpdateRows(cases: CalendarCase[]) {
  return cases
    .flatMap(caseData => caseData.updates.map(update => ({
      createdAt: update.created_at,
      row: {
        'รหัสเคส': caseData.id,
        'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
        'วัน-เวลาบันทึก': formatThaiDateTime(update.created_at),
        'ผู้บันทึก': update.caretaker?.name || '-',
        'กิจกรรม': update.activity_note || '-',
        'ผลการติดตาม': update.result_note || '-',
        'ขั้นตอนถัดไป': update.next_step || '-',
      },
    })))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(item => item.row)
}

function calendarSignatureRows(cases: CalendarCase[]) {
  return cases.flatMap(caseData => caseData.signatures.map(signature => ({
    'รหัสเคส': caseData.id,
    'ประเภทเคส': getCaseTypeLabel(caseData.case_type, caseData.other_text),
    'ชื่อผู้ลงนาม': signature.signer_name,
    'บทบาทผู้ลงนาม': signature.signer_role,
    'วัน-เวลาที่ลงนาม': formatThaiDateTime(signature.signed_at),
    'มีภาพลายเซ็น': signature.signature_data ? 'มี' : 'ไม่มี',
  })))
}

export function exportMonthlyCasesToExcel(monthTitle: string, cases: CalendarCase[]) {
  const workbook = XLSX.utils.book_new()
  appendSheet(workbook, 'เคสประจำเดือน', calendarCaseRows(cases), [8, 38, 30, 14, 24, 48, 30, 24, 48, 16, 16, 24, 24])
  appendSheet(workbook, 'การติดตาม', calendarUpdateRows(cases), [38, 30, 24, 24, 48, 48, 48])
  appendSheet(workbook, 'ผู้ลงนาม', calendarSignatureRows(cases), [38, 30, 28, 22, 24, 18])
  XLSX.writeFile(workbook, `รายงานเคส_${filenamePart(monthTitle)}.xlsx`)
}
