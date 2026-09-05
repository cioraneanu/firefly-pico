import { startOfDay, startOfMonth, subMonths, addMonths, subDays, setDate, getDate, getDaysInMonth } from 'date-fns'
import DateUtils from '~/utils/DateUtils'

export const rangePreset = {
  last3Months: { t: 'analytics.range.last_3_months', code: 'last3Months', monthCount: 3 },
  last6Months: { t: 'analytics.range.last_6_months', code: 'last6Months', monthCount: 6 },
  last12Months: { t: 'analytics.range.last_12_months', code: 'last12Months', monthCount: 12 },
  last24Months: { t: 'analytics.range.last_24_months', code: 'last24Months', monthCount: 24 },
  yearToDate: { t: 'analytics.range.year_to_date', code: 'yearToDate', monthCount: null },
  custom: { t: 'analytics.range.custom', code: 'custom', monthCount: null },
}
export const rangePresetList = Object.values(rangePreset)

// firstDayOfMonth isn't gated to <=28 at this layer (only the settings-page dropdown caps it at
// 27 today), so clamp defensively rather than let setDate() overflow into the next month.
export function financialMonthStart(monthAnchor, firstDayOfMonth) {
  const clampedDay = Math.min(firstDayOfMonth, getDaysInMonth(monthAnchor))
  return startOfDay(setDate(monthAnchor, clampedDay))
}

export function financialMonthEnd(start) {
  // date-fns addMonths clamps day-of-month overflow to the target month's last day (doesn't
  // roll into the following month) — this is why this is safe unlike naive Date arithmetic.
  return subDays(addMonths(start, 1), 1)
}

export function financialMonthKey(financialMonthStartDate) {
  // Keyed off the START date, so e.g. Aug27-Sep26 keys "2026-08" not "2026-09".
  return DateUtils.dateToString(financialMonthStartDate, 'yyyy-MM')
}

export function currentFinancialMonth(now, firstDayOfMonth) {
  // Port of dashboardStore.init()'s algorithm.
  const monthToSub = getDate(now) < firstDayOfMonth ? 1 : 0
  const monthAnchor = subMonths(startOfMonth(now), monthToSub)
  const start = financialMonthStart(monthAnchor, firstDayOfMonth)
  return { start, end: financialMonthEnd(start) }
}

export function resolveRange(preset, referenceDate, firstDayOfMonth, customRange = null) {
  const entry = typeof preset === 'string' ? rangePreset[preset] : preset
  const code = entry?.code ?? preset
  const current = currentFinancialMonth(referenceDate, firstDayOfMonth)

  if (code === rangePreset.custom.code) {
    if (!customRange?.start || !customRange?.end) {
      throw new Error('resolveRange: custom preset requires customRange = { start, end }')
    }
    const start = financialMonthStart(customRange.start, firstDayOfMonth)
    const end = financialMonthEnd(financialMonthStart(customRange.end, firstDayOfMonth))
    return { start, end }
  }

  if (code === rangePreset.yearToDate.code) {
    const jan1 = new Date(referenceDate.getFullYear(), 0, 1)
    const start = currentFinancialMonth(jan1, firstDayOfMonth).start
    return { start, end: current.end }
  }

  const monthCount = entry?.monthCount
  if (!monthCount) throw new Error(`resolveRange: unrecognized preset ${JSON.stringify(preset)}`)
  const start = financialMonthStart(subMonths(current.start, monthCount - 1), firstDayOfMonth)
  return { start, end: current.end }
}

export function eachFinancialMonth(start, end, firstDayOfMonth) {
  if (!start || !end || end < start) return []
  const months = []
  let cursor = start
  const MAX_ITERATIONS = 240 // defensive cap vs the 24-month analytics use case
  for (let i = 0; cursor <= end && i < MAX_ITERATIONS; i++) {
    months.push({ start: cursor, end: financialMonthEnd(cursor), key: financialMonthKey(cursor) })
    cursor = financialMonthStart(addMonths(cursor, 1), firstDayOfMonth)
  }
  return months
}

export function rangeLabel(range) {
  if (!range?.start || !range?.end) return ''
  const startLabel = DateUtils.dateToUI(range.start)
  const endLabel = DateUtils.dateToUI(range.end)
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

export function shiftRange(range, count, firstDayOfMonth) {
  if (count === 0) return range
  const start = financialMonthStart(addMonths(range.start, count), firstDayOfMonth)
  const end = financialMonthEnd(financialMonthStart(addMonths(range.end, count), firstDayOfMonth))
  return { start, end }
}
