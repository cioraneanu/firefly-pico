import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const sourcePaths = ['pages/todo-inbox.vue', 'composables/useTodoInbox.js', 'components/todo-inbox/todo-inbox-transaction-item.vue']
const source = (await Promise.all(sourcePaths.map((path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')))).join('\n')
const usedKeys = [...new Set([...source.matchAll(/todo_inbox\.([a-z_]+)/g)].map((match) => match[1]))].sort()
const localeDirectory = new URL('../i18n/locales/', import.meta.url)
const english = JSON.parse(await readFile(new URL('en.json', localeDirectory), 'utf8')).todo_inbox
const placeholders = (text) => [...text.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]).sort()

for (const filename of (await readdir(localeDirectory)).filter((name) => name.endsWith('.json'))) {
  test(`${filename} has exactly the used Inbox labels and preserves their placeholders`, async () => {
    const labels = JSON.parse(await readFile(new URL(filename, localeDirectory), 'utf8')).todo_inbox
    assert.deepEqual(Object.keys(labels).sort(), usedKeys)
    for (const key of usedKeys) {
      assert.ok(labels[key].trim(), `${key} is empty`)
      assert.deepEqual(placeholders(labels[key]), placeholders(english[key]), `${key} has different placeholders`)
    }
  })
}

test('Inbox styles only refer to classes used by the page and card', async () => {
  const css = (await Promise.all(['theme-white.css', 'theme-dark.css'].map((name) => readFile(new URL(`../assets/styles/${name}`, import.meta.url), 'utf8')))).join('\n')
  const styledClasses = [...new Set([...css.matchAll(/\.(todo-inbox-[a-z-]+)/g)].map((match) => match[1]))]
  assert.deepEqual(
    styledClasses.filter((className) => !source.includes(className)),
    [],
  )
})
