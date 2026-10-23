import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

test('a timed-out Inbox PUT is reread, not automatically replayed by the HTTP client', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const result = await build({
    stdin: { contents: "import axios from 'axios'; import '~/plugins/axios.js'; import { useTodoInbox } from '~/composables/useTodoInbox.js'; export { axios, useTodoInbox }", resolveDir: root },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    packages: 'external',
    tsconfigRaw: {},
    alias: { '~': root },
    banner: {
      js: "const useAppStore = () => ({ isDesktopLayout: false, hasAuthToken: true, authToken: 'synthetic', picoBackendURL: 'https://example.invalid', queryTimeout: 8000 }); const useTagStore = () => ({ tagTodo: { attributes: { tag: 'todo' } } }); const useI18n = () => ({ t: key => key }); const useLoadingStore = () => ({}); const defineNuxtPlugin = x => x; const sleep = async () => {}; const UIUtils = { showToastError() {} };",
    },
    plugins: [
      {
        name: 'ledger-boundaries',
        setup(build) {
          const doubles = {
            'TagRepository.js': 'export default class {}',
            'TransactionTransformer.js': 'export default { transformFromApi: x => x, transformFromApiList: x => x }',
            'Tag.js': 'export default { getDisplayName: x => x.attributes.tag }',
            'UIUtils.js': 'export default { showConfirmation: async () => true, showToastSuccess() {}, showToastError() {} }',
          }
          build.onResolve({ filter: /\/(TagRepository|TransactionTransformer|Tag|UIUtils)\.js$/ }, ({ path }) => ({ path: path.split('/').at(-1), namespace: 'boundary' }))
          build.onLoad({ filter: /.*/, namespace: 'boundary' }, ({ path }) => ({ contents: doubles[path] }))
        },
      },
    ],
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports)
  const { axios, useTodoInbox } = module.exports
  const originalAdapter = axios.defaults.adapter
  const requests = []
  let tags = ['todo', 'imported']
  const item = () => ({ id: '42', attributes: { transactions: [{ transaction_journal_id: '101', tags: [...tags] }] } })
  axios.defaults.adapter = async (config) => {
    requests.push(config.method)
    if (config.method === 'put') {
      tags = ['imported', 'concurrent-tag']
      throw new axios.AxiosError('timeout', 'ECONNABORTED', config)
    }
    return { status: 200, data: { data: item() }, config, headers: {} }
  }
  try {
    const inbox = useTodoInbox()
    await inbox.doneItem(item())
    assert.deepEqual(requests, ['get', 'put', 'get'])
    assert.equal(inbox.receipts.value.length, 1)
    assert.deepEqual(inbox.receipts.value[0].journalIds, ['101'])
  } finally {
    axios.defaults.adapter = originalAdapter
    axios.interceptors.request.clear()
    axios.interceptors.response.clear()
  }
})
