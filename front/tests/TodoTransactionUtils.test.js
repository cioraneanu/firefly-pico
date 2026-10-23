import test from 'node:test'
import assert from 'node:assert/strict'
import * as TodoUtils from '../utils/TodoTransactionUtils.js'
import {
  TODO_BATCH_CONCURRENCY,
  TODO_PAGE_SIZE,
  buildTodoRemovalRequest,
  buildTodoRestoreRequest,
  buildTodoTransactionsPath,
  getActiveTodoItems,
  getDefaultTodoDateRange,
  getTodoJournalIds,
  hasTodoMarker,
  hasTodoMarkerOnJournals,
  runWithConcurrency,
} from '../utils/TodoTransactionUtils.js'

test('selected dates are queried in bounded windows without gaps or overlapping days', () => {
  assert.deepEqual(TodoUtils.getTodoDateWindows({ start: '2026-03-01', end: '2026-09-26' }), [
    { start: '2026-06-29', end: '2026-09-26' },
    { start: '2026-03-31', end: '2026-06-28' },
    { start: '2026-03-01', end: '2026-03-30' },
  ])
  assert.deepEqual(TodoUtils.getTodoDateWindows({ start: '2026-09-26', end: '2026-09-26' }), [{ start: '2026-09-26', end: '2026-09-26' }])
})

test('date-filter input rejects invalid dates before formatting and defaults cleared fields', () => {
  assert.throws(() => TodoUtils.getTodoFilterDateRange({ dateStart: new Date('invalid') }), RangeError)
  assert.deepEqual(TodoUtils.getTodoFilterDateRange({}, new Date(2026, 8, 26)), { start: '2026-06-29', end: '2026-09-26' })
  assert.throws(() => TodoUtils.getTodoFilterDateRange({ dateStart: new Date(2026, 9, 1), dateEnd: new Date(2026, 8, 1) }), RangeError)
})

test('default TODO dates cover the last 90 days including today', () => {
  assert.deepEqual(getDefaultTodoDateRange(new Date(2026, 8, 24)), { start: '2026-06-27', end: '2026-09-24' })
  assert.deepEqual(getDefaultTodoDateRange(new Date(2024, 2, 1)), { start: '2023-12-03', end: '2024-03-01' })
})

const makeTransaction = () => ({
  id: '42',
  attributes: {
    group_title: 'Weekly shop',
    transactions: [
      { transaction_journal_id: '101', tags: ['todo', 'imported'] },
      { transaction_journal_id: '102', tags: ['groceries'] },
      { transaction_journal_id: 103, tags: ['todo', 'family'] },
    ],
  },
})

test('removes the marker while retaining unmarked journals in the replacement list', () => {
  const result = buildTodoRemovalRequest(makeTransaction(), 'todo')

  assert.deepEqual(result.journalIds, ['101', '103'])
  assert.deepEqual(result.requestData, {
    apply_rules: false,
    fire_webhooks: false,
    group_title: 'Weekly shop',
    transactions: [{ transaction_journal_id: '101', tags: ['imported'] }, { transaction_journal_id: '102' }, { transaction_journal_id: 103, tags: ['family'] }],
  })
})

test('preserves every unrelated tag while removing duplicate marker values', () => {
  const transaction = makeTransaction()
  transaction.attributes.transactions[0].tags = ['todo', 'imported', 'todo', 'personal']

  const result = buildTodoRemovalRequest(transaction, 'todo')

  assert.deepEqual(result.requestData.transactions[0].tags, ['imported', 'personal'])
})

test('returns no changed journals when the marker is already absent', () => {
  const transaction = makeTransaction()
  transaction.attributes.transactions.forEach((split) => {
    split.tags = split.tags.filter((tag) => tag !== 'todo')
  })

  assert.deepEqual(getTodoJournalIds(transaction, 'todo'), [])
  assert.equal(hasTodoMarker(transaction, 'todo'), false)
  assert.deepEqual(buildTodoRemovalRequest(transaction, 'todo').requestData.transactions, [])
})

test('restores the marker to surviving original journals without replacing current tags', () => {
  const transaction = makeTransaction()
  transaction.attributes.transactions[0].tags = ['imported', 'new-tag']
  transaction.attributes.transactions.splice(2, 1)

  const result = buildTodoRestoreRequest(transaction, 'todo', ['101', '103'])

  assert.deepEqual(result.restoredJournalIds, ['101'])
  assert.deepEqual(result.missingJournalIds, ['103'])
  assert.equal(result.isAlreadyRestored, false)
  assert.deepEqual(result.requestData, {
    apply_rules: false,
    fire_webhooks: false,
    group_title: 'Weekly shop',
    transactions: [{ transaction_journal_id: '101', tags: ['imported', 'new-tag', 'todo'] }, { transaction_journal_id: '102' }],
  })
})

test('does not duplicate a marker that is already restored', () => {
  const transaction = makeTransaction()

  const result = buildTodoRestoreRequest(transaction, 'todo', [101, 103])

  assert.equal(result.isAlreadyRestored, true)
  assert.deepEqual(result.restoredJournalIds, ['101', '103'])
  assert.deepEqual(result.missingJournalIds, [])
  assert.deepEqual(result.requestData.transactions, [])
})

test('verifies the marker on every expected journal after undo', () => {
  const transaction = makeTransaction()

  assert.equal(hasTodoMarkerOnJournals(transaction, 'todo', ['101', '103']), true)

  transaction.attributes.transactions[2].tags = ['family']
  assert.equal(hasTodoMarkerOnJournals(transaction, 'todo', ['101', '103']), false)
  assert.equal(hasTodoMarkerOnJournals(transaction, 'todo', ['101', '999']), false)
  assert.equal(hasTodoMarkerOnJournals(transaction, 'todo', []), false)
})

test('encodes the marker name in the tag-transactions path', () => {
  assert.equal(buildTodoTransactionsPath('review/Needs attention'), 'api/tags/review%2FNeeds%20attention/transactions')
  assert.equal(buildTodoTransactionsPath('Проверить'), 'api/tags/%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D1%8C/transactions')
})

test('prefers the tag ID so hierarchical marker names stay one path segment', () => {
  const tag = { id: '314', attributes: { tag: 'smart-processor/to-review' } }

  assert.equal(buildTodoTransactionsPath(tag), 'api/tags/314/transactions')
})

test('filters completed receipts from active items', () => {
  const items = [{ id: '42' }, { id: '43' }]
  const receipts = [{ id: '42' }]

  assert.deepEqual(getActiveTodoItems(items, receipts), [{ id: '43' }])
})

test('limits concurrent workers while preserving result order', async () => {
  let active = 0
  let maximum = 0
  const results = await runWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    active += 1
    maximum = Math.max(maximum, active)
    await new Promise((resolve) => setTimeout(resolve, value % 2 === 0 ? 2 : 5))
    active -= 1
    return value * 2
  })

  assert.equal(maximum, 2)
  assert.deepEqual(
    results.map((result) => result.value),
    [2, 4, 6, 8],
  )
  assert.deepEqual(
    results.map((result) => result.status),
    ['fulfilled', 'fulfilled', 'fulfilled', 'fulfilled'],
  )
})

test('settles every batch item and reports progress when one worker fails', async () => {
  const progress = []
  const results = await runWithConcurrency(
    [1, 2, 3],
    TODO_BATCH_CONCURRENCY,
    async (value) => {
      if (value === 2) {
        throw new Error('failed item')
      }
      return value
    },
    ({ processed }) => progress.push(processed),
  )

  assert.equal(results[0].status, 'fulfilled')
  assert.equal(results[1].status, 'rejected')
  assert.equal(results[1].reason.message, 'failed item')
  assert.equal(results[2].status, 'fulfilled')
  assert.deepEqual(
    progress.sort((a, b) => a - b),
    [1, 2, 3],
  )
})

test('rejects an invalid concurrency limit', async () => {
  await assert.rejects(() => runWithConcurrency([1], 0, async (value) => value), RangeError)
})

test('uses a fixed page size suitable for the Firefly endpoint', () => {
  assert.equal(TODO_PAGE_SIZE, 50)
})
