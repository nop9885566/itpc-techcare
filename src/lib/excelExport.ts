import * as XLSX from 'xlsx'
import type { CaseWithDetails, Student, CalendarCase } from '@/lib/types'
import { formatThaiDate, formatThaiDateTime } from '@/lib/dateUtils'
import { getCaseTypeLabel, getStatusLabel } from '@/lib/types'

/**
 * Export a student's cases to an Excel (.xlsx) file
 */
export function exportStudentCasesToExcel(student: Student, cases: CaseWithDetails[]) {
  const rows = cases.map((c, index) => ({
    'ลำดับ': index + 1,
    'ประเภทเคส': getCaseTypeLabel(c.case_type, c.other_text),
    'สถานะ': getStatusLabel(c.status),
    'วัน-เวลานัด': formatThaiDateTime(c.scheduled_at),
    'รายละเอียด': c.details || '-',
    'ผู้ดูแล': c.caretakers.map(ct => ct.name).join(', ') || '-',
    'ผู้สร้างเคส': c.creator?.name || '-',
    'จำนวนการอัปเดต': c.updates.length,
    'จำนวนลายเซ็น': c.signatures.length,
    'วันที่สร้าง': formatThaiDate(c.created_at),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
    'ลำดับ': '-',
    'ประเภทเคส': 'ไม่มีประวัติเคส',
    'สถานะ': '-',
    'วัน-เวลานัด': '-',
    'รายละเอียด': '-',
    'ผู้ดูแล': '-',
    'ผู้สร้างเคส': '-',
    'จำนวนการอัปเดต': 0,
    'จำนวนลายเซ็น': 0,
    'วันที่สร้าง': '-',
  }])

  // Auto-width columns
  const colWidths = [
    { wch: 8 },  // ลำดับ
    { wch: 30 }, // ประเภทเคส
    { wch: 14 }, // สถานะ
    { wch: 22 }, // วัน-เวลา
    { wch: 35 }, // รายละเอียด
    { wch: 25 }, // ผู้ดูแล
    { wch: 20 }, // ผู้สร้าง
    { wch: 16 }, // อัปเดต
    { wch: 16 }, // ลายเซ็น
    { wch: 18 }, // วันที่สร้าง
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติการดูแล')

  const studentName = `${student.first_name_th}_${student.last_name_th}`
  XLSX.writeFile(workbook, `เคส_${studentName}_${formatThaiDate(new Date().toISOString())}.xlsx`)
}

/**
 * Export monthly cases to an Excel (.xlsx) file
 */
export function exportMonthlyCasesToExcel(monthTitle: string, cases: CalendarCase[]) {
  const rows = cases.map((c, index) => ({
    'ลำดับ': index + 1,
    'ประเภทเคส': getCaseTypeLabel(c.case_type, c.other_text),
    'สถานะ': getStatusLabel(c.status),
    'วัน-เวลานัด': formatThaiDateTime(c.scheduled_at),
    'นักเรียน': c.students.map(s => `${s.first_name_th} ${s.last_name_th} (${s.grade}/${s.room})`).join(', ') || '-',
    'ผู้ดูแล': c.caretakers.map(ct => ct.name).join(', ') || '-',
    'รายละเอียด': c.details || '-',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
    'ลำดับ': '-',
    'ประเภทเคส': 'ไม่มีเคสในเดือนนี้',
    'สถานะ': '-',
    'วัน-เวลานัด': '-',
    'นักเรียน': '-',
    'ผู้ดูแล': '-',
    'รายละเอียด': '-',
  }])

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 14 },
    { wch: 22 },
    { wch: 40 },
    { wch: 25 },
    { wch: 35 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'เคสประจำเดือน')

  XLSX.writeFile(workbook, `รายงานเคส_${monthTitle.replace(/\s+/g, '_')}.xlsx`)
}
