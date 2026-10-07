import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

globalThis.transactionDescriptionRequire = createRequire(import.meta.url)
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../models/Transaction.js', import.meta.url))],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  tsconfigRaw: {},
  alias: { '~': fileURLToPath(new URL('../', import.meta.url)) },
  banner: { js: 'const require = globalThis.transactionDescriptionRequire' },
  plugins: [
    {
      name: 'nuxt-translations',
      setup(build) {
        build.onResolve({ filter: /\/plugins\/plugin-i18n(?:\.js)?$/ }, () => ({ path: 'translations', namespace: 'nuxt' }))
        build.onLoad({ filter: /.*/, namespace: 'nuxt' }, () => ({
          contents: 'export const translate = () => { throw new Error("Descriptions must not require translations") }',
          loader: 'js',
        }))
      },
    },
  ],
})
const { default: Transaction } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

const transaction = (groupTitle, ...descriptions) => ({
  attributes: { group_title: groupTitle, transactions: descriptions.map((description) => ({ description })) },
})

for (const description of ['Market #032', 'Scheduled Payment to ACCT# 1234 Confirmation# EXAMPLE', 'Market purchase']) {
  test(`an empty group title falls back to the description: ${description}`, () => {
    assert.equal(Transaction.getDescription(transaction('', description)), description)
  })
}

test('a named split group takes precedence over individual descriptions', () => {
  assert.equal(Transaction.getDescription(transaction('Weekly shop #1', 'Groceries', 'Household')), 'Weekly shop #1')
})

for (const groupTitle of [null, undefined]) {
  test(`a ${groupTitle} group title falls back to the first split description`, () => {
    assert.equal(Transaction.getDescription(transaction(groupTitle, 'Groceries #032', 'Household')), 'Groceries #032')
  })
}

test('a transaction without a title or description uses the existing placeholder', () => {
  assert.equal(Transaction.getDescription(transaction('', '')), ' - ')
  assert.equal(Transaction.getDescription(transaction(null, null)), ' - ')
  assert.equal(Transaction.getDescription(transaction(undefined)), ' - ')
  assert.equal(Transaction.getDescription(undefined), ' - ')
})
