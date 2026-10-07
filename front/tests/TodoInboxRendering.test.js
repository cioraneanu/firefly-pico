import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Button, Cell, Loading } from 'vant'

async function renderItem(overrides = {}, { desktop = true, needsExpansion = true } = {}) {
  const source = await readFile(new URL('../components/todo-inbox/todo-inbox-transaction-item.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const { compile: compileTemplate } = await import('@vue/compiler-dom')
  const { code } = compileTemplate(descriptor.template.content, { mode: 'function', prefixIdentifiers: true })
  const render = new Function('Vue', code)(Vue)
  const props = { value: { id: '42' }, receipt: null, isProcessing: false, isQueued: false, isExpanded: true, error: null, ...overrides }
  const app = Vue.createSSRApp({
    render,
    setup: () => ({
      props,
      appStore: { isDesktopLayout: desktop },
      reviewDisplay: desktop || props.isExpanded,
      hasReviewContext: false,
      needsExpansion,
      description: 'Harbor Market',
      amounts: [],
      dateFormatted: '09/01/2026 14:35',
      splits: [],
      firstSplit: {},
      isSplitPayment: false,
      emit() {},
      TablerIconConstants: {},
    }),
  })
  app.config.globalProperties.$t = (key) => key
  app.component('van-cell', Cell)
  app.component('van-button', Button)
  app.component('van-loading', Loading)
  for (const name of ['app-icon', 'transaction-list-item-desktop', 'transaction-list-item', 'transaction-split-view', 'transaction-split-badge', 'account-badge']) {
    app.component(name, { render: () => Vue.h('span', name) })
  }
  return renderToString(app)
}

test('a confirmed receipt replaces the review card and exposes only Undo', async () => {
  const html = await renderItem({ receipt: { id: '42', journalIds: ['101'] } })
  assert.match(html, /todo_inbox.undo/)
  assert.doesNotMatch(html, /todo_inbox.collapse|todo_inbox.details/)
})

test('saving immediately replaces the review card without offering Undo yet', async () => {
  const html = await renderItem({ isProcessing: true })
  assert.match(html, /todo_inbox.saving/)
  assert.doesNotMatch(html, /todo_inbox.undo|todo_inbox.collapse|todo_inbox.details/)
})

test('queued batch items are compact before a worker starts', async () => {
  const html = await renderItem({ isQueued: true })
  assert.match(html, /todo_inbox.queued/)
  assert.doesNotMatch(html, /todo_inbox.collapse|todo_inbox.details/)
})

test('a failed save restores the review controls and inline retry', async () => {
  const html = await renderItem({ error: 'Could not confirm completion' })
  assert.match(html, /Could not confirm completion/)
  assert.match(html, /todo_inbox.retry/)
  assert.match(html, /todo_inbox.collapse/)
})

test('an Undo failure keeps the receipt instead of duplicating the card', async () => {
  const html = await renderItem({ receipt: { id: '42', journalIds: ['101'] }, error: 'Try Undo again' })
  assert.match(html, /Try Undo again/)
  assert.doesNotMatch(html, /todo_inbox.collapse|todo_inbox.details/)
})

test('mobile wrapper selects the shared card and follows its expansion eligibility', async () => {
  const short = await renderItem({ isExpanded: false }, { desktop: false, needsExpansion: false })
  assert.match(short, /transaction-list-item/)
  assert.doesNotMatch(short, /todo_inbox.details/)
  const long = await renderItem({ isExpanded: false }, { desktop: false, needsExpansion: true })
  assert.match(long, /todo_inbox.details/)
  assert.doesNotMatch(long, /todo-inbox-review-details/)
})

test('desktop wrapper selects the shared row and follows its expansion eligibility', async () => {
  const short = await renderItem({ isExpanded: false }, { desktop: true, needsExpansion: false })
  assert.match(short, /transaction-list-item-desktop/)
  assert.doesNotMatch(short, /todo-inbox-review-details/)
  assert.doesNotMatch(short, /todo_inbox.details/)
  const long = await renderItem({ isExpanded: false }, { desktop: true, needsExpansion: true })
  assert.match(long, /todo_inbox.details/)
})

test('shared transaction rows are statically resolvable for Nuxt auto-import', async () => {
  const source = await readFile(new URL('../components/todo-inbox/todo-inbox-transaction-item.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const { compile } = await import('@vue/compiler-dom')
  const { code } = compile(descriptor.template.content, { mode: 'function', prefixIdentifiers: true })

  assert.match(code, /resolveComponent\("transaction-list-item-desktop"\)/)
  assert.match(code, /resolveComponent\("transaction-list-item"\)/)
  assert.equal((code.match(/"safe-notes":/g) ?? []).length, 2)
})

test('review expansion stays within the existing transaction row', async () => {
  const source = await readFile(new URL('../components/todo-inbox/todo-inbox-transaction-item.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const { compile } = await import('@vue/compiler-dom')
  const { code } = compile(descriptor.template.content, { mode: 'function', prefixIdentifiers: true })

  assert.doesNotMatch(code, /resolveComponent\("todo-inbox-review-details"\)/)
  assert.match(code, /"review-display":/)
})
