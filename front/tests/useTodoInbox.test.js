import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const transaction = (id, tags = ['todo', 'imported']) => ({
  id: String(id),
  type: 'transactions',
  attributes: { transactions: [{ transaction_journal_id: `${id}01`, description: 'Market', amount: '12.34', tags }] },
})
const response = (data) => ({ status: 200, data: { data } })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => (resolve = done))
  return { promise, resolve }
}

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../composables/useTodoInbox.js', import.meta.url))],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  tsconfigRaw: {},
  alias: { '~': fileURLToPath(new URL('../', import.meta.url)) },
  banner: {
    js: 'const useAppStore = () => globalThis.todoTest.app; const useTagStore = () => globalThis.todoTest.tags; const useI18n = () => ({ t: key => key }); const navigateTo = async () => {};',
  },
  plugins: [
    {
      name: 'external-boundaries',
      setup(build) {
        const doubles = {
          'TagRepository.js': 'export default class { constructor() { return globalThis.todoTest.tagRepository } }',
          'TransactionRepository.js': 'export default class { constructor() { return globalThis.todoTest.transactionRepository } }',
          'TransactionTransformer.js': 'export default { transformFromApi: x => x, transformFromApiList: x => x, transformToApi: x => ({ transactions: x.attributes.transactions }) }',
          'Tag.js': 'export default { getDisplayName: x => x.attributes.tag }',
          'UIUtils.js': 'export default { showConfirmation: async () => globalThis.todoTest.confirm ? globalThis.todoTest.confirm() : true, showToastSuccess() {}, showToastError() {} }',
        }
        build.onResolve({ filter: /\/(TagRepository|TransactionRepository|TransactionTransformer|Tag|UIUtils)\.js$/ }, ({ path }) => ({ path: path.split('/').at(-1), namespace: 'boundary' }))
        build.onLoad({ filter: /.*/, namespace: 'boundary' }, ({ path }) => ({ contents: doubles[path], loader: 'js' }))
      },
    },
  ],
})
const { useTodoInbox } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text + '\n//# sourceURL=todo-inbox-test-bundle.js').toString('base64')}`)

test('Expand all follows eligible active cards and can collapse a mixed selection', async () => {
  const inbox = await inboxWith([transaction(1), transaction(2), transaction(3)])
  inbox.setExpandable(transaction(1), true)
  inbox.setExpandable(transaction(2), true)
  assert.equal(inbox.hasExpandableItems.value, true)
  inbox.toggleExpanded(transaction(1))
  inbox.toggleAllExpanded()
  assert.deepEqual([...inbox.expandedIds.value], ['1', '2'])
  assert.equal(inbox.allExpanded.value, true)
  inbox.toggleAllExpanded()
  assert.equal(inbox.expandedIds.value.size, 0)
  inbox.setExpandable(transaction(1), false)
  inbox.setExpandable(transaction(2), false)
  assert.equal(inbox.hasExpandableItems.value, false)
})

test('refresh keeps expansion eligibility for reused cards', async () => {
  const inbox = await inboxWith([transaction(1)])
  inbox.setExpandable(transaction(1), true)
  await inbox.refreshList()
  assert.equal(inbox.hasExpandableItems.value, true)
})

test('batch confirmation freezes the loaded set and refuses to open over an editor', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  assert.equal(await inbox.markLoadedDone(), false)
  await inbox.closeEditor()
  const confirmation = deferred()
  globalThis.todoTest.confirm = () => confirmation.promise
  const batch = inbox.markLoadedDone()
  assert.equal(await inbox.refreshList(), false)
  assert.equal(await inbox.loadMore(), false)
  assert.equal(await inbox.openEditor(item), false)
  confirmation.resolve(false)
  assert.equal(await batch, false)
  assert.equal(inbox.receipts.value.length, 0)
})

test('infinite loading rescans shrinking results and retains receipts and row positions', async () => {
  const ledger = Array.from({ length: 110 }, (_, index) => transaction(index + 1))
  const inbox = await inboxWith(ledger.slice(0, 50))
  globalThis.todoTest.tagRepository.getTodoTransactions = async (_tag, { page, pageSize }) => {
    const marked = ledger.filter((item) => item.attributes.transactions[0].tags.includes('todo'))
    return { status: 200, data: { data: marked.slice((page - 1) * pageSize, page * pageSize), meta: { pagination: { total_pages: Math.ceil(marked.length / pageSize) } } } }
  }
  globalThis.todoTest.transactionRepository.getTodoTransaction = async (id) => response(ledger.find((item) => item.id === String(id)))
  globalThis.todoTest.transactionRepository.updateTodoTransaction = async (id, data) => {
    const item = ledger.find((item) => item.id === String(id))
    item.attributes.transactions = data.transactions
    return response(item)
  }
  await inbox.doneItem(ledger[0])
  const firstRow = inbox.items.value[0]
  assert.equal(await inbox.loadMore(), true)
  assert.equal(inbox.items.value[0], firstRow)
  assert.deepEqual(
    inbox.items.value.map((item) => item.id),
    Array.from({ length: 100 }, (_, index) => String(index + 1)),
  )
  assert.equal(inbox.receipts.value.length, 1)
  await inbox.undoItem(firstRow)
  await inbox.loadMore()
  assert.equal(new Set(inbox.items.value.map((item) => item.id)).size, 110)
  assert.equal(inbox.isFinished.value, true)
})

test('failed infinite append retains the previous list, expansion and Undo', async () => {
  const inbox = await inboxWith([transaction(1), transaction(2)])
  inbox.toggleExpanded(transaction(2))
  await inbox.doneItem(transaction(1))
  const rows = [...inbox.items.value]
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => ({ status: 503 })
  assert.equal(await inbox.loadMore(), false)
  assert.deepEqual(inbox.items.value, rows)
  assert.equal(inbox.receipts.value.length, 1)
  assert.equal(inbox.expandedIds.value.has('2'), true)
  assert.equal(inbox.loadError.value, 'todo_inbox.load_error')
})

test('stale and deleted candidates do not cause an endless empty append', async () => {
  const inbox = await inboxWith([])
  globalThis.todoTest.tagRepository.getTodoTransactions = async (_tag, { page }) => ({
    status: 200,
    data: { data: Array.from({ length: 50 }, (_, index) => transaction((page - 1) * 50 + index + 1)), meta: { pagination: { total_pages: 2 } } },
  })
  globalThis.todoTest.transactionRepository.getTodoTransaction = async (id) => (Number(id) <= 50 ? response(transaction(id, [])) : { status: 404 })
  assert.equal(await inbox.loadMore(), true)
  assert.deepEqual(inbox.items.value, [])
  assert.equal(inbox.isFinished.value, false)
  assert.equal(await inbox.loadMore(), true)
  assert.equal(inbox.isFinished.value, true)
})

test('an edited date outside the filter keeps its slot as context, without offering Undo', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  inbox.editorItem.value.attributes.transactions[0].date = '2020-01-01'
  assert.equal(await inbox.saveEditor(), true)
  assert.equal(inbox.activeItems.value.length, 0)
  assert.equal(inbox.items.value.length, 1)
  assert.equal(inbox.receipts.value[0].messageKey, 'todo_inbox.outside_dates')
  assert.deepEqual(inbox.receipts.value[0].journalIds, [])
})

async function inboxWith(items, repository = {}) {
  globalThis.todoTest = {
    app: { isDesktopLayout: false },
    tags: { tagTodo: { id: '1', attributes: { tag: 'todo' } } },
    tagRepository: { getTodoTransactions: async () => ({ ...response(items), data: { data: items, meta: { pagination: { current_page: 1, per_page: 50, total_pages: 1, total: items.length } } } }) },
    transactionRepository: {
      getTodoTransaction: async (id) => response(items.find((item) => item.id === String(id))),
      updateTodoTransaction: async (id, data) => response({ ...items.find((item) => item.id === String(id)), attributes: { transactions: data.transactions } }),
    },
  }
  const inbox = useTodoInbox()
  await inbox.refreshList()
  Object.assign(globalThis.todoTest.transactionRepository, repository)
  return inbox
}

test('loads complete groups when the tag endpoint returns only matching splits', async () => {
  const partial = transaction(1)
  const complete = structuredClone(partial)
  complete.attributes.transactions.push({ transaction_journal_id: '102', description: 'Other split', amount: '7.66', tags: ['household'] })
  const inbox = await inboxWith([partial])
  globalThis.todoTest.transactionRepository.getTodoTransaction = async () => response(complete)
  await inbox.refreshList()
  assert.deepEqual(inbox.items.value[0].attributes.transactions, complete.attributes.transactions)
})

test('date filters reach older data and never send an unbounded tag query', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  const queries = []
  globalThis.todoTest.tagRepository.getTodoTransactions = async (_tag, options) => {
    queries.push(options)
    return response([item])
  }
  const range = { start: '2025-03-01', end: '2025-03-31' }
  assert.equal(await inbox.refreshList(range), true)
  assert.deepEqual(inbox.dateRange.value, range)
  assert.deepEqual({ start: queries[0].start, end: queries[0].end }, range)
})

test('filter changes cannot interrupt an active write or discard Undo on a failed load', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.doneItem(item)
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => ({ status: 503 })
  assert.equal(await inbox.refreshList({ start: '2025-03-01', end: '2025-03-31' }), false)
  assert.equal(inbox.receipts.value.length, 1)
  assert.notEqual(inbox.dateRange.value.start, '2025-03-01')
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => response([item])
  assert.equal(await inbox.retryLoad(), true)
  assert.equal(inbox.dateRange.value.start, '2025-03-01')
})

test('does not show partial transaction details if loading a complete group fails', async () => {
  const inbox = await inboxWith([])
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => response([transaction(1)])
  globalThis.todoTest.transactionRepository.getTodoTransaction = async () => ({ status: 503 })
  assert.equal(await inbox.refreshList(), false)
  assert.equal(inbox.loadError.value, 'todo_inbox.load_error')
  assert.deepEqual(inbox.items.value, [])
})

test('counts remaining loaded groups instead of the API journal total', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => ({ status: 200, data: { data: [item], meta: { pagination: { total: 2 } } } })
  await inbox.refreshList()
  assert.equal(inbox.remainingCount.value, 1)
  await inbox.doneItem(item)
  assert.equal(inbox.remainingCount.value, 0)
})

test('Done becomes pending immediately, blocks duplicate writes, and retains its slot', async () => {
  const read = deferred()
  const item = transaction(1)
  const inbox = await inboxWith([item], { getTodoTransaction: () => read.promise })
  const saving = inbox.doneItem(item)
  assert.equal(inbox.getState(1).isProcessing, true)
  assert.deepEqual(await inbox.doneItem(item), { status: 'ignored' })
  assert.equal(inbox.items.value.length, 1)
  read.resolve(response(item))
  await saving
  assert.equal(inbox.items.value.length, 1)
  assert.equal(inbox.receipts.value.length, 1)
})

test('list loading blocks Done, Undo and batch actions until the list is settled', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item, transaction(2)])
  await inbox.doneItem(item)
  const read = deferred()
  globalThis.todoTest.tagRepository.getTodoTransactions = () => read.promise
  const loading = inbox.refreshList()
  assert.equal(await inbox.undoItem(item), false)
  assert.deepEqual(await inbox.doneItem(transaction(2)), { status: 'ignored' })
  assert.equal(await inbox.markLoadedDone(), false)
  read.resolve(response([]))
  await loading
})

test('batch queues every row before the first read finishes', async () => {
  const read = deferred()
  const items = [1, 2, 3, 4, 5].map((id) => transaction(id))
  const inbox = await inboxWith(items, {
    getTodoTransaction: async (id) => {
      await read.promise
      return response(transaction(id))
    },
  })
  const batch = inbox.markLoadedDone()
  await Promise.resolve()
  assert.equal(
    items.every((item) => inbox.getState(item.id).isProcessing || inbox.getState(item.id).isQueued),
    true,
  )
  assert.equal(inbox.getState(4).isQueued, true)
  read.resolve()
  await batch
  assert.equal(inbox.receipts.value.length, 5)
})

test('failed saves restore the previous expansion state and expose an inline error', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item], { updateTodoTransaction: async () => ({ status: 422, data: { message: 'Validation failed' } }) })
  inbox.toggleExpanded(item)
  await assert.rejects(inbox.doneItem(item))
  assert.equal(inbox.getState(1).isProcessing, false)
  assert.equal(inbox.getState(1).error, 'Validation failed')
  assert.equal(inbox.expandedIds.value.has('1'), true)
  assert.equal(inbox.receipts.value.length, 0)
})

test('a timed-out save is reread and confirmed without a second write', async () => {
  let reads = 0
  let writes = 0
  const item = transaction(1)
  const inbox = await inboxWith([item], {
    getTodoTransaction: async () => response(transaction(1, ++reads === 1 ? ['todo', 'imported'] : ['imported'])),
    updateTodoTransaction: async () => {
      writes++
      return { code: 'ECONNABORTED' }
    },
  })
  await inbox.doneItem(item)
  assert.equal(inbox.receipts.value.length, 1)
  assert.equal(writes, 1)
  assert.equal(reads, 2)
})

test('an unconfirmed timeout retains journal information for a safe retry and Undo', async () => {
  let reads = 0
  let writes = 0
  const item = transaction(1)
  const inbox = await inboxWith([item], {
    getTodoTransaction: async () => (++reads === 2 ? { status: 503 } : response(transaction(1, reads === 1 ? ['todo', 'imported'] : ['imported']))),
    updateTodoTransaction: async () => {
      writes++
      return { code: 'ECONNABORTED' }
    },
  })
  await assert.rejects(inbox.doneItem(item))
  assert.equal(inbox.getState(1).error, 'todo_inbox.completion_unconfirmed')
  await inbox.doneItem(item)
  assert.equal(writes, 1)
  assert.deepEqual(inbox.receipts.value[0].journalIds, ['101'])
})

test('a transaction completed elsewhere leaves a stable receipt without Undo', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item], { getTodoTransaction: async () => response(transaction(1, ['imported'])) })
  await inbox.doneItem(item)
  assert.equal(inbox.items.value.length, 1)
  assert.deepEqual(inbox.receipts.value[0].journalIds, [])
})

test('Undo restores the expanded mobile review state', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  inbox.toggleExpanded(item)
  await inbox.doneItem(item)
  await inbox.undoItem(item)
  assert.equal(inbox.receipts.value.length, 0)
  assert.equal(inbox.expandedIds.value.has('1'), true)
})

test('Done after Undo does not claim an unrelated completion as its own', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.doneItem(item)
  await inbox.undoItem(item)
  globalThis.todoTest.transactionRepository.getTodoTransaction = async () => response(transaction(1, ['imported']))
  await inbox.doneItem(item)
  assert.deepEqual(inbox.receipts.value[0].journalIds, [])
})

test('popup editing fetches a fresh transaction and updates its row without reloading the page', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  let writes = 0
  let listReads = 0
  globalThis.todoTest.tagRepository.getTodoTransactions = async () => {
    listReads++
    throw new Error('list should not reload')
  }
  globalThis.todoTest.transactionRepository.updateTodoTransaction = async (id, data) => {
    writes++
    return response({ id, attributes: { transactions: data.transactions } })
  }
  await inbox.openEditor(item)
  assert.equal(inbox.editorOpen.value, true)
  inbox.editorItem.value.attributes.transactions[0].description = 'Corrected market'
  assert.equal(await inbox.saveEditor(), true)
  assert.equal(inbox.editorOpen.value, false)
  assert.equal(inbox.items.value[0].attributes.transactions[0].description, 'Corrected market')
  assert.equal(writes, 1)
  assert.equal(listReads, 0)
})

test('popup save refuses to overwrite a transaction changed since opening', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  inbox.editorItem.value.attributes.transactions[0].description = 'My change'
  globalThis.todoTest.transactionRepository.getTodoTransaction = async () => response(transaction(1, ['todo', 'other change']))
  let writes = 0
  globalThis.todoTest.transactionRepository.updateTodoTransaction = async () => writes++
  assert.equal(await inbox.saveEditor(), false)
  assert.equal(writes, 0)
  assert.equal(inbox.editorOpen.value, true)
  assert.equal(inbox.editorError.value, 'todo_inbox.editor_changed')
})

test('editing away the TODO marker keeps a stable receipt without Undo', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  inbox.editorItem.value.attributes.transactions[0].tags = ['imported']
  inbox.editorItem.value.attributes.transactions[0].description = 'Corrected market'
  assert.equal(await inbox.saveEditor(), true)
  assert.deepEqual(inbox.receipts.value[0].journalIds, [])
  assert.equal(inbox.remainingCount.value, 0)
  assert.equal(inbox.items.value[0].attributes.transactions[0].description, 'Corrected market')
})

test('desktop review starts with visible details but keeps long notes collapsed', async () => {
  const inbox = await inboxWith([transaction(1)])
  globalThis.todoTest.app.isDesktopLayout = true
  await inbox.refreshList()
  assert.equal(inbox.expandedIds.value.size, 0)
})

test('a thrown edit write is held for reread before any retry', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  let writes = 0
  globalThis.todoTest.transactionRepository.updateTodoTransaction = async () => {
    writes++
    throw new Error('timeout')
  }
  assert.equal(await inbox.saveEditor(), false)
  assert.equal(inbox.editorUnconfirmed.value, true)
  assert.equal(await inbox.saveEditor(), false)
  assert.equal(writes, 1)
})

test('a local payload error does not get mistaken for an uncertain server write', async () => {
  const item = transaction(1)
  const inbox = await inboxWith([item])
  await inbox.openEditor(item)
  inbox.editorItem.value.attributes = null
  assert.equal(await inbox.saveEditor(), false)
  assert.equal(inbox.editorUnconfirmed.value, false)
})
