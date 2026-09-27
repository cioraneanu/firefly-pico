import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { computed } from 'vue'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

globalThis.todoRowTest = { computed, require: createRequire(import.meta.url) }
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../composables/useTransactionListItem.js', import.meta.url))],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  tsconfigRaw: {},
  alias: { '~': fileURLToPath(new URL('../', import.meta.url)) },
  banner: { js: 'const require = globalThis.todoRowTest.require; const computed = globalThis.todoRowTest.computed; const useI18n = () => ({ locale: { value: "en-US" } });' },
  plugins: [
    {
      name: 'store-boundaries',
      setup(build) {
        build.onResolve({ filter: /\/stores\/\w+(?:\.js)?$/ }, ({ path }) => ({ path: path.split('/').at(-1).replace(/\.js$/, ''), namespace: 'store' }))
        build.onLoad({ filter: /.*/, namespace: 'store' }, ({ path }) => ({
          contents: `export const use${path[0].toUpperCase()}${path.slice(1)} = () => ({ accountDictionary: {}, transactionListFieldsConfig: [] })`,
          loader: 'js',
        }))
      },
    },
  ],
})
const { useTransactionListItem } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text + '\n//# sourceURL=transaction-row-test-bundle.js').toString('base64')}`)
const transaction = (notes) => ({ attributes: { transactions: [{ notes, tags: [] }] } })

test('collapsed Inbox rows safely render real transaction notes', () => {
  const row = useTransactionListItem({ value: transaction('<img src=x onerror=alert(1)>\n\n**Review me**'), reviewDisplay: false, safeNotes: true })
  assert.doesNotMatch(row.notes.value, /<img\b/)
  assert.match(row.notes.value, /&lt;img/)
  assert.match(row.notes.value, /<strong>Review me<\/strong>/)
})

test('expanded Inbox rows retain markdown and suppress remote images', () => {
  const row = useTransactionListItem({ value: transaction('![receipt](https://example.com/track.png)\n\n[details](https://example.com)'), reviewDisplay: true, safeNotes: true })
  assert.doesNotMatch(row.notes.value, /<img\b/)
  assert.match(row.notes.value, /receipt/)
  assert.match(row.notes.value, /rel="noopener noreferrer"/)
})
