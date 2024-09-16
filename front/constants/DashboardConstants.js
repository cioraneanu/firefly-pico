export const DASHBOARD_SECTIONS = {
  accounts: 'accounts',
  expensesLastWeek: 'expensesLastWeek',
  transactionSummary: 'transactionSummary',
  budgets: 'budgets',
  savings: 'savings',
  expensesByTag: 'expensesByTag',
  expensesByCategory: 'expensesByCategory',
  todosTransactions: 'todoTransactions',
}

export const DASHBOARD_SECTIONS_LIST = [
  { code: DASHBOARD_SECTIONS.accounts, name: 'Accounts summary', isVisible: true },
  { code: DASHBOARD_SECTIONS.expensesLastWeek, name: 'Expenses this week', isVisible: true },
  { code: DASHBOARD_SECTIONS.transactionSummary, name: 'Transactions summary', isVisible: true },
  { code: DASHBOARD_SECTIONS.budgets, name: 'Budgets', isVisible: true },
  { code: DASHBOARD_SECTIONS.savings, name: 'Savings', isVisible: true },
  { code: DASHBOARD_SECTIONS.expensesByTag, name: 'Expenses by tags', isVisible: true },
  { code: DASHBOARD_SECTIONS.expensesByCategory, name: 'Expenses by categories', isVisible: true },
  { code: DASHBOARD_SECTIONS.todosTransactions, name: 'Todo transactions', isVisible: true },
]
