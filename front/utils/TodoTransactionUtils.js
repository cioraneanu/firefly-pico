import { format, isValid, parseISO, subDays } from 'date-fns'

export const TODO_PAGE_SIZE = 50
export const TODO_BATCH_CONCURRENCY = 3
export const TODO_DATE_WINDOW_DAYS = 90

export const getDefaultTodoDateRange = (today = new Date()) => ({ start: format(subDays(today, TODO_DATE_WINDOW_DAYS - 1), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') })

export const getTodoDateWindows = ({ start, end }) => {
  if (!isValid(parseISO(start ?? '')) || !isValid(parseISO(end ?? '')) || start > end) throw new RangeError('Invalid TODO date range')
  const windows = []
  let currentEnd = end
  while (currentEnd >= start) {
    const currentStart = format(subDays(parseISO(currentEnd), TODO_DATE_WINDOW_DAYS - 1), 'yyyy-MM-dd')
    windows.push({ start: currentStart < start ? start : currentStart, end: currentEnd })
    currentEnd = format(subDays(parseISO(windows.at(-1).start), 1), 'yyyy-MM-dd')
  }
  return windows
}

export const getTodoFilterDateRange = ({ dateStart, dateEnd }, today = new Date()) => {
  if ((dateStart && !isValid(dateStart)) || (dateEnd && !isValid(dateEnd))) throw new RangeError('Invalid TODO date range')
  const defaults = getDefaultTodoDateRange(today)
  const range = { start: dateStart ? format(dateStart, 'yyyy-MM-dd') : defaults.start, end: dateEnd ? format(dateEnd, 'yyyy-MM-dd') : defaults.end }
  if (range.start > range.end) throw new RangeError('Invalid TODO date range')
  return range
}

const getSplits = (transaction) => transaction?.attributes?.transactions ?? []
const getTags = (split) => split?.tags ?? []
const getJournalKey = (id) => String(id)
const hasMarker = (split, markerName) => getTags(split).includes(markerName)

const getRequestData = (transaction, changes) => ({
  apply_rules: false,
  fire_webhooks: false,
  ...(changes.length > 0 && getSplits(transaction).length > 1 ? { group_title: transaction.attributes.group_title } : {}),
  // Firefly replaces the journal list, so unchanged splits must retain their IDs.
  transactions:
    changes.length === 0
      ? []
      : getSplits(transaction).map(
          (split) => changes.find((change) => getJournalKey(change.transaction_journal_id) === getJournalKey(split.transaction_journal_id)) ?? { transaction_journal_id: split.transaction_journal_id },
        ),
})

export const buildTodoTransactionsPath = (tag) => `api/tags/${encodeURIComponent(typeof tag === 'object' ? (tag?.id ?? tag?.attributes?.tag) : tag)}/transactions`

export const getTodoJournalIds = (transaction, markerName) =>
  getSplits(transaction)
    .filter((split) => hasMarker(split, markerName))
    .map((split) => getJournalKey(split.transaction_journal_id))

export const hasTodoMarker = (transaction, markerName) => getTodoJournalIds(transaction, markerName).length > 0

export const hasTodoMarkerOnJournals = (transaction, markerName, journalIds) => {
  const splitByJournalId = new Map(getSplits(transaction).map((split) => [getJournalKey(split.transaction_journal_id), split]))
  const expectedJournalIds = [...new Set(journalIds.map(getJournalKey))]
  return expectedJournalIds.length > 0 && expectedJournalIds.every((journalId) => hasMarker(splitByJournalId.get(journalId), markerName))
}

export const buildTodoRemovalRequest = (transaction, markerName) => {
  const markedSplits = getSplits(transaction).filter((split) => hasMarker(split, markerName))

  return {
    journalIds: markedSplits.map((split) => getJournalKey(split.transaction_journal_id)),
    requestData: getRequestData(
      transaction,
      markedSplits.map((split) => ({
        transaction_journal_id: split.transaction_journal_id,
        tags: getTags(split).filter((tag) => tag !== markerName),
      })),
    ),
  }
}

export const buildTodoRestoreRequest = (transaction, markerName, journalIds) => {
  const requestedJournalIds = [...new Set(journalIds.map(getJournalKey))]
  const splitByJournalId = new Map(getSplits(transaction).map((split) => [getJournalKey(split.transaction_journal_id), split]))
  const restoredJournalIds = requestedJournalIds.filter((journalId) => splitByJournalId.has(journalId))
  const missingJournalIds = requestedJournalIds.filter((journalId) => !splitByJournalId.has(journalId))
  const transactions = restoredJournalIds
    .map((journalId) => splitByJournalId.get(journalId))
    .filter((split) => !hasMarker(split, markerName))
    .map((split) => ({
      transaction_journal_id: split.transaction_journal_id,
      tags: [...getTags(split), markerName],
    }))

  return {
    restoredJournalIds,
    missingJournalIds,
    isAlreadyRestored: restoredJournalIds.length > 0 && transactions.length === 0,
    requestData: getRequestData(transaction, transactions),
  }
}

export const getActiveTodoItems = (items, receipts) => {
  const receiptIds = new Set(receipts.map((receipt) => String(receipt.id)))
  return items.filter((item) => !receiptIds.has(String(item.id)))
}

export const runWithConcurrency = async (items, limit, worker, onProgress) => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Concurrency limit must be a positive integer')
  }

  const results = new Array(items.length)
  let nextIndex = 0
  let processed = 0

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      let result

      try {
        result = { status: 'fulfilled', value: await worker(items[index], index) }
      } catch (reason) {
        result = { status: 'rejected', reason }
      }

      results[index] = result
      processed += 1
      onProgress?.({ processed, total: items.length, index, result })
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}
