import test from 'node:test'
import assert from 'node:assert/strict'

import * as TodoReviewUtils from '../utils/TodoReviewUtils.js'

const { renderTodoNotes, getTodoReviewAmounts, hasHiddenTodoReviewData, hasClippedTodoReviewContent } = TodoReviewUtils

test('renders markdown blocks, lists and tables without losing text', () => {
  const html = renderTodoNotes?.('## Order\n\n**Verified**\n\n- Milk\n- Bread\n\n```text\nvery long line\n```\n\n| Item | Cost |\n|---|---|\n| Milk | 4 |')
  assert.match(html ?? '', /<h2>Order<\/h2>/)
  assert.match(html, /<strong>Verified<\/strong>/)
  assert.match(html, /<li>Milk<\/li>/)
  assert.match(html, /<pre><code[^>]*>very long line/)
  assert.match(html, /<table>/)
})

test('raw HTML and image URLs cannot execute or load remote content', () => {
  const html = renderTodoNotes?.('<img src=x onerror=alert(1)>\n\n![receipt](https://example.com/tracker.png)\n\n<script>alert(1)</script>')
  assert.match(html ?? '', /&lt;img/)
  assert.doesNotMatch(html, /<img|<script/)
  assert.match(html, /receipt/)
})

test('unsafe markdown links cannot become clickable links', () => {
  for (const url of ['javascript:alert%281%29', 'data:text/html,test', 'vbscript:test', 'java&#x73;cript:alert%281%29']) {
    const html = renderTodoNotes?.(`[Open](${url})`)
    assert.equal(html?.includes('<a '), false, url)
  }
})

test('safe links escape attributes and protect the opener', () => {
  const html = renderTodoNotes?.('[Open](https://example.com/path?q=1&other=2 "Title")')
  assert.match(html ?? '', /href="https:\/\/example.com\/path\?q=1&amp;other=2"/)
  assert.match(html, /rel="noopener noreferrer"/)
})

test('review totals retain exact decimals and separate currencies and transaction types', () => {
  const splits = [
    { type: { code: 'expense' }, amount: '9007199254740993.01', currency_code: 'USD' },
    { type: { code: 'expense' }, amount: '0.09', currency_code: 'USD' },
    { type: { code: 'income' }, amount: '5.25', currency_code: 'EUR' },
    { type: { code: 'transfer' }, amount: '3.00', currency_code: 'USD' },
  ]
  assert.deepEqual(getTodoReviewAmounts?.(splits, 'en'), [
    { key: 'expense-USD', type: 'expense', text: '-9,007,199,254,740,993.10 USD' },
    { key: 'income-EUR', type: 'income', text: '+5.25 EUR' },
    { key: 'transfer-USD', type: 'transfer', text: '3.00 USD' },
  ])
})

test('short mobile cards need no expansion, while extra tags, splits and review fields do', () => {
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'], notes: 'Short note' }]), false)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['one', 'two', 'three', 'four', 'five'] }]), true)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'], bill_name: 'Monthly rent' }]), true)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'] }, { tags: [] }]), true)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'], bill_name: 'Monthly rent' }], [], { recurringTransactionsEnabled: false }), false)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'], category: null, type: { fireflyCode: 'withdrawal' } }], [], { categoriesEnabled: true }), true)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['todo'], notes: 'Short note' }], [], { transactionListFieldsConfig: [{ code: 'notes', isVisible: false }] }), true)
})

test('a one-line note still needs expansion when a visible tag name was shortened', () => {
  assert.equal(hasHiddenTodoReviewData([{ notes: 'Short note', tags: [{ attributes: { tag: 'groceries/food' } }, { attributes: { tag: 'smart-processor/to-review' } }] }]), true)
  assert.equal(hasHiddenTodoReviewData([{ tags: [{ attributes: { tag: 'groceries' } }] }]), false)
  assert.equal(hasHiddenTodoReviewData([{ tags: ['smart-processor/to-review'] }], [], { tagsEnabled: false }), false)
  assert.equal(hasHiddenTodoReviewData([{ tags: [undefined, null] }]), false)
})

test('expand visibility follows actual clipped content instead of note length guesses', () => {
  const row = { querySelectorAll: () => [{ scrollHeight: 36, clientHeight: 36, scrollWidth: 70, clientWidth: 70 }] }
  assert.equal(hasClippedTodoReviewContent(row), false)
  row.querySelectorAll = () => [{ scrollHeight: 54, clientHeight: 36, scrollWidth: 70, clientWidth: 70 }]
  assert.equal(hasClippedTodoReviewContent(row), true)
})
