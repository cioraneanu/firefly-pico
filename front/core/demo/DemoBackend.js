import { createDemoSeed } from '~/core/demo/DemoSeed.js'
import RouteConstants from '~/core/constants/RouteConstants.js'

// Demo mode: an axios adapter that answers every API request from a localStorage database instead of the Pico backend.
// Generic CRUD for every seeded resource, a transaction search that only applies the date range and type, and an empty answer for everything else.
// Balances, budget spending and totals are not computed.

const STORAGE_KEY = 'demoDB'
// Pico-owned resources are flat, Firefly ones are JSON:API { id, type, attributes }
const FLAT_RESOURCES = ['transaction-templates']

const loadDB = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? createDemoSeed()
const saveDB = (db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db))

const paginate = (list, params) => {
  const limit = parseInt(params.get('limit') ?? 50)
  const page = parseInt(params.get('page') ?? 1)
  const data = list.slice((page - 1) * limit, page * limit)
  return { data, meta: { pagination: { total: list.length, count: data.length, per_page: limit, current_page: page, total_pages: Math.max(1, Math.ceil(list.length / limit)) } } }
}

const searchTransactions = (db, params) => {
  const query = params.get('query') ?? ''
  const [after, before, type] = ['date_after', 'date_before', 'type'].map((name) => query.match(new RegExp(`${name}:(\\S+)`))?.[1])
  const firstSplit = (item) => item.attributes.transactions[0]
  return db.transactions
    .filter((item) => {
      const { date, type: splitType } = firstSplit(item)
      return (!after || date.slice(0, 10) >= after) && (!before || date.slice(0, 10) <= before) && (!type || splitType === type)
    })
    .sort((a, b) => firstSplit(b).date.localeCompare(firstSplit(a).date))
}

// Fills in what the server would: ids, journal ids, currencies, the account balance
const withServerFields = (resource, item, old, db) => {
  if (resource === 'accounts') item.attributes.current_balance = item.attributes.opening_balance ?? '0'
  if (resource === 'transaction-templates') item.tags = (item.tags ?? []).map((tagId) => ({ tag_id: `${tagId}` }))
  if (resource === 'transactions') {
    const oldSplits = old?.attributes.transactions ?? []
    item.attributes.transactions = item.attributes.transactions.map((split, index) => {
      const oldSplit = oldSplits.find((oldSplit) => oldSplit.transaction_journal_id === `${split.transaction_journal_id}`) ?? oldSplits[index] ?? {}
      const { currency_id, currency_code } = db.accounts.find((account) => account.id === `${split.source_id}`)?.attributes ?? {}
      return { currency_id, currency_code, ...oldSplit, ...split, transaction_journal_id: oldSplit.transaction_journal_id ?? `${db.nextId++}` }
    })
  }
  return item
}

const handle = (method, path, params, body) => {
  const db = loadDB()
  const [resource, id, action] = path.split('/')

  if (path === 'user') return { data: { id: '1', type: 'users', attributes: { email: 'demo@example.com' } } }
  if (path === 'currencies/exchange') return { rates: { USD: 1, EUR: 0.92 } }
  if (path === 'search/transactions' || (path === 'transactions' && method === 'GET')) return paginate(searchTransactions(db, params), params)

  const list = db[resource]
  if (!list || action) return { data: [] }

  // Currencies are updated and deleted by code
  const index = list.findIndex((item) => item.id === id || item.attributes?.code === id)
  if (id && index < 0) return { data: null }

  const isFlat = FLAT_RESOURCES.includes(resource)
  let item = null

  if (method === 'GET') return id ? { data: list[index] } : paginate(list, params)
  if (method === 'DELETE') list.splice(index, 1)
  if (method === 'POST') {
    const newId = `${db.nextId++}`
    // Firefly creates accounts, budgets, ... active
    item = isFlat ? { ...body, id: newId } : { id: newId, type: resource, attributes: { active: true, ...body } }
    list.push(withServerFields(resource, item, null, db))
  }
  if (method === 'PUT') {
    const old = list[index]
    item = isFlat ? { ...old, ...body, id: old.id } : { ...old, attributes: { ...old.attributes, ...body } }
    list[index] = withServerFields(resource, item, old, db)
  }

  saveDB(db)
  return { data: item }
}

export const demoAdapter = async (config) => {
  const url = new URL(config.url, window.location.origin)
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  const method = config.method.toUpperCase()
  const data = handle(method, url.pathname.split('/api/').pop(), url.searchParams, body)
  return { data, status: method === 'DELETE' ? 204 : 200, statusText: 'OK', headers: {}, config, request: {} }
}

export async function startDemo() {
  const appStore = useAppStore()
  saveDB(createDemoSeed())
  appStore.isDemoMode = true
  appStore.authToken = 'demo'
  await appStore.fetchInfo()
  await appStore.syncEverything()
  await navigateTo(RouteConstants.ROUTE_DASHBOARD)
}

// Back to a fresh install: the demo data and every setting made while trying it are dropped
export function exitDemo() {
  localStorage.clear()
  window.location.reload()
}
