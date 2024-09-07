export const DASHBOARD_SECTIONS = {
  accounts: 'accounts',
  expensesLastWeek: 'expensesLastWeek',
  transactionSummary: 'transactionSummary',
  expensesByTag: 'expensesByTag',
  expensesByCategory: 'expensesByCategory',
  todosTransactions: 'todoTransactions',
}

export const DASHBOARD_SECTIONS_LIST = [
  { code: DASHBOARD_SECTIONS.accounts, name: 'Accounts summary' },
  { code: DASHBOARD_SECTIONS.expensesLastWeek, name: 'Expenses this week' },
  { code: DASHBOARD_SECTIONS.transactionSummary, name: 'Transactions summary' },
  { code: DASHBOARD_SECTIONS.expensesByTag, name: 'Expenses by tags' },
  { code: DASHBOARD_SECTIONS.expensesByCategory, name: 'Expenses by categories' },
  { code: DASHBOARD_SECTIONS.todosTransactions, name: 'Todo transactions' },
]
