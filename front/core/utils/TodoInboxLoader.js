import { format, isValid, parseISO, subDays } from 'date-fns'
import { chunk } from 'lodash-es'

export const TODO_PAGE_SIZE = 50
const TODO_DATE_WINDOW_DAYS = 90
// Leave room under Pico's shared API rate limit for a fresh read and write per reviewed group.
const TODO_BATCH_SIZE = 12
const DETAIL_CONCURRENCY = 3
const formatDate = (date) => format(date, 'yyyy-MM-dd')

export function getTodoDateRange({ dateStart, dateEnd }, today = new Date()) {
  if ((dateStart && !isValid(dateStart)) || (dateEnd && !isValid(dateEnd))) throw new RangeError('Invalid TODO date range')
  const end = dateEnd || today
  const start = dateStart || subDays(end, TODO_DATE_WINDOW_DAYS - 1)
  const range = { start: formatDate(start), end: formatDate(end) }
  if (range.start > range.end) throw new RangeError('Invalid TODO date range')
  return range
}

export function getTodoDateWindows({ start, end }) {
  const windows = []
  let currentEnd = end
  while (currentEnd >= start) {
    const currentStart = formatDate(subDays(parseISO(currentEnd), TODO_DATE_WINDOW_DAYS - 1))
    const windowStart = currentStart < start ? start : currentStart
    windows.push({ start: windowStart, end: currentEnd })
    currentEnd = formatDate(subDays(parseISO(windowStart), 1))
  }
  return windows
}

export async function loadTodoPage({ range, tagName, seenIds, readPage, readGroup }) {
  const windows = getTodoDateWindows(range)
  const seen = new Set(seenIds)
  const ids = []
  let isFinished = true

  // Done and Put Back change the offsets. Rescan for unseen group IDs on each batch.
  windowsLoop: for (const [index, window] of windows.entries()) {
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const result = await readPage({ ...window, page, pageSize: TODO_PAGE_SIZE })
      if (!Array.isArray(result?.data) || result.data.some((item) => item?.id == null)) throw new Error('Could not read TODO page')
      if (!result.data.length) break
      totalPages = Number(result.meta?.pagination?.total_pages)
      if (!Number.isSafeInteger(totalPages) || totalPages < 1) throw new Error('Invalid TODO pagination')
      const unseen = [...new Set(result.data.map((item) => String(item.id)))].filter((id) => !seen.has(id))
      const remaining = TODO_BATCH_SIZE - ids.length
      unseen.slice(0, remaining).forEach((id) => {
        seen.add(id)
        ids.push(id)
      })
      if (ids.length === TODO_BATCH_SIZE) {
        isFinished = index === windows.length - 1 && page >= totalPages && unseen.length <= remaining
        break windowsLoop
      }
    }
  }

  // Tag results can omit unmarked splits. Only new group IDs need full reads.
  const items = []
  for (const batch of chunk(ids, DETAIL_CONCURRENCY)) {
    const groups = await Promise.all(batch.map(readGroup))
    items.push(...groups.filter((group) => group?.attributes?.transactions?.some((split) => split.transaction_journal_id && split.tags?.includes(tagName))))
  }
  return { items, seenIds: seen, isFinished }
}
