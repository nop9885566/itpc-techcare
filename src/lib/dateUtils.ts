import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { th } from 'date-fns/locale'

export function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr)
    return format(date, 'd MMM yyyy', { locale: th })
  } catch {
    return '-'
  }
}

export function formatThaiDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr)
    return format(date, 'd MMM yyyy เวลา HH:mm น.', { locale: th })
  } catch {
    return '-'
  }
}

export function formatThaiMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: th })
}

export function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export function isSameDayUtil(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

export function isSameMonthUtil(a: Date, b: Date): boolean {
  return isSameMonth(a, b)
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1)
}

export function prevMonth(date: Date): Date {
  return subMonths(date, 1)
}

export function toISODateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const THAI_DAY_NAMES_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
