import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../transformers/TransactionTransformer.js', import.meta.url))],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  alias: { '~': root },
  plugins: [
    {
      name: 'transformer-boundaries',
      setup(build) {
        const doubles = {
          profileStore: 'export const useProfileStore = () => ({ autoAddedTags: [{ name: "default" }] })',
          accountStore: 'export const useAccountStore = () => ({})',
          categoryStore: 'export const useCategoryStore = () => ({})',
          tagStore: 'export const useTagStore = () => ({})',
          budgetStore: 'export const useBudgetStore = () => ({})',
          piggyBankStore: 'export const usePiggyBankStore = () => ({})',
          currencyStore: 'export const useCurrencyStore = () => ({})',
          appStore: 'export const useAppStore = () => ({})',
          ApiTransformer: 'export default class {}',
          TransactionConstants: 'export const transactionExtraDateFieldList = []',
          LanguageUtils: 'export default {}',
          Account: 'export default { getDisplayName: x => x.name }',
          Transaction: 'export default { getTransactionTypeForAccounts: () => ({ fireflyCode: "withdrawal" }) }',
          Tag: 'export default { getDisplayNameEllipsized: x => x.name }',
          DateUtils: 'export default { dateToString: () => "2026-09-24" }',
        }
        build.onResolve(
          {
            filter:
              /(?:\/|\.\/)(profileStore|accountStore|categoryStore|tagStore|budgetStore|piggyBankStore|currencyStore|appStore|ApiTransformer|TransactionConstants|LanguageUtils|Account|Transaction|Tag|DateUtils)(?:\.js)?$/,
          },
          ({ path }) => ({ path: path.split('/').at(-1).replace(/\.js$/, ''), namespace: 'boundary' }),
        )
        build.onLoad({ filter: /.*/, namespace: 'boundary' }, ({ path }) => ({ contents: doubles[path], loader: 'js' }))
      },
    },
  ],
})
const { default: TransactionTransformer } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('updating an existing transaction does not add default tags', () => {
  const item = {
    id: '42',
    attributes: {
      transactions: [
        {
          amount: '12.34',
          description: 'Market',
          date: new Date('2026-09-24'),
          accountSource: { id: '1', name: 'Checking' },
          accountDestination: { id: '2', name: 'Market' },
          tags: [{ name: 'todo' }],
        },
      ],
    },
  }
  const request = TransactionTransformer.transformToApi(item)
  assert.deepEqual(request.transactions[0].tags, ['todo'])
})
