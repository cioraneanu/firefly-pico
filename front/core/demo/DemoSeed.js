import { addDays, format, setDate, setHours, startOfDay, subDays, subMonths } from 'date-fns'

// Starting data for demo mode, in the shapes the Pico backend returns. Dates are relative to today so the dashboard always has data.

const entity = (type, id, attributes) => ({ id: `${id}`, type, attributes })
const dateTime = (date, hour) => format(setHours(date, hour), 'yyyy-MM-dd HH:mm')

const accounts = [
  [1, 'Checking', 'asset', 'defaultAsset', '2450.30', 'svgo-fluent-building-bank-20-regular'],
  [2, 'Savings', 'asset', 'savingAsset', '8200', 'svgo-fluent-savings-24-regular'],
  [3, 'Cash', 'asset', 'cashWalletAsset', '85', 'svgo-fluent-wallet-20-regular'],
  [4, 'Employer', 'revenue', null, '0', null],
  [5, 'Supermarket', 'expense', null, '0', null],
  [6, 'Landlord', 'expense', null, '0', null],
  [7, 'Restaurant', 'expense', null, '0', null],
  [8, 'Gas station', 'expense', null, '0', null],
  [9, 'Pharmacy', 'expense', null, '0', null],
].map(([id, name, type, account_role, balance, icon]) =>
  entity('accounts', id, { name, type, account_role, icon, currency_id: '1', currency_code: 'EUR', opening_balance: balance, current_balance: balance, active: true, include_net_worth: true }),
)

const categories = [
  [1, 'Groceries', 'svgo-fluent-food-apple-20-regular'],
  [2, 'Rent', 'svgo-fluent-building-home-16-regular'],
  [3, 'Eating out', 'svgo-fluent-food-pizza-20-regular'],
  [4, 'Transport', 'svgo-fluent-vehicle-car-profile-24-regular'],
  [5, 'Health', 'svgo-fluent-dentist-20-regular'],
  [6, 'Salary', 'svgo-fluent-wallet-20-regular'],
].map(([id, name, icon]) => entity('categories', id, { name, icon }))

const tags = ['vacation', 'work', 'family'].map((tag, index) => entity('tags', index + 1, { tag, description: null, date: null, is_todo: false }))

// [type, source, destination, category, budget, description, amount]
const kinds = {
  salary: ['deposit', 4, 1, 6, null, 'Salary', () => 3200],
  rent: ['withdrawal', 1, 6, 2, null, 'Rent', () => 950],
  savings: ['transfer', 1, 2, null, null, 'Monthly savings', () => 300],
  groceries: ['withdrawal', 1, 5, 1, 1, 'Groceries', (i) => 20 + ((i * 37) % 70)],
  eatingOut: ['withdrawal', 3, 7, 3, 1, 'Dinner', (i) => 15 + ((i * 13) % 30)],
  fuel: ['withdrawal', 1, 8, 4, null, 'Fuel', (i) => 50 + ((i * 7) % 20)],
  health: ['withdrawal', 1, 9, 5, null, 'Pharmacy', (i) => 12 + ((i * 11) % 25)],
}

const transactionList = () => {
  const today = startOfDay(new Date())
  const rows = []
  for (let month = 0; month < 3; month++) {
    const firstDay = setDate(subMonths(today, month), 1)
    rows.push(['salary', firstDay, 9], ['rent', firstDay, 10], ['savings', addDays(firstDay, 1), 11], ['health', addDays(firstDay, 12), 18, month])
  }
  for (let day = 0; day < 90; day++) {
    const date = subDays(today, day)
    if (day % 4 === 0) rows.push(['groceries', date, 18, day])
    if (day % 7 === 2) rows.push(['eatingOut', date, 20, day])
    if (day % 10 === 5) rows.push(['fuel', date, 8, day])
  }

  return rows
    .filter(([, date, hour]) => setHours(date, hour) <= new Date())
    .map(([kind, date, hour, i = 0], index) => {
      const [type, source_id, destination_id, category_id, budget_id, description, amount] = kinds[kind]
      const tags = kind === 'eatingOut' && i % 3 === 0 ? ['family'] : []
      const split = {
        transaction_journal_id: `${index + 1}`,
        type,
        date: dateTime(date, hour),
        description,
        amount: `${amount(i)}`,
        currency_id: '1',
        currency_code: 'EUR',
        source_id: `${source_id}`,
        destination_id: `${destination_id}`,
        category_id: category_id && `${category_id}`,
        budget_id: budget_id && `${budget_id}`,
        tags,
        notes: null,
      }
      return entity('transactions', index + 1, { group_title: null, transactions: [split] })
    })
}

export function createDemoSeed() {
  const today = new Date()
  const transactions = transactionList()

  return {
    nextId: transactions.length + 100,
    currencies: [entity('currencies', 1, { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2, default: true, enabled: true })],
    accounts,
    categories,
    tags,
    budgets: [entity('budgets', 1, { name: 'Food', active: true, auto_budget_type: 'reset', auto_budget_period: 'monthly', auto_budget_amount: '600', currency_id: '1' })],
    'budget-limits': [],
    'piggy-banks': [
      entity('piggy-banks', 1, {
        name: 'Summer vacation',
        icon: 'svgo-fluent-rocket-24-regular',
        target_amount: '2000',
        current_amount: '650',
        accounts: [{ account_id: '2', current_amount: '650' }],
        currency_id: '1',
        start_date: format(subMonths(today, 2), 'yyyy-MM-dd'),
        target_date: format(addDays(today, 180), 'yyyy-MM-dd'),
      }),
    ],
    recurrences: [
      entity('recurrences', 1, {
        type: 'withdrawal',
        title: 'Rent',
        first_date: format(setDate(subMonths(today, 3), 1), 'yyyy-MM-dd'),
        active: true,
        repetitions: [{ type: 'monthly', moment: '1', skip: 0, weekend: 1 }],
        transactions: [{ id: '1', description: 'Rent', amount: '950', currency_id: '1', currency_code: 'EUR', source_id: '1', destination_id: '6', category_id: '2', tags: [] }],
      }),
    ],
    'transaction-templates': [
      {
        id: '1',
        name: 'Coffee',
        extra_names: [],
        amount: '3.50',
        description: 'Coffee',
        account_source_id: '3',
        account_destination_id: '7',
        category_id: '3',
        budget_id: '1',
        tags: [],
        type: 'withdrawal',
      },
    ],
    transactions,
  }
}
