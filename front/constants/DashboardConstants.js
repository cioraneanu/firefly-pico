export const dashboardCard = {
  calendar: { t: 'calendar', code: 'calendar', isVisible: true },
  accounts: { t: 'settings.dashboard.cards.accounts_summary', code: 'accounts', isVisible: true },
  expensesLastWeek: { t: 'settings.dashboard.cards.expenses_this_week', code: 'expensesLastWeek', isVisible: true },
  transactionsSummary: { t: 'settings.dashboard.cards.transactions_summary', code: 'transactionSummary', isVisible: true },
  budgets: { t: 'budgets', code: 'budgets', isVisible: true },
  expensesByTag: { t: 'settings.dashboard.cards.expenses_by_tag', code: 'expensesByTag', isVisible: true },
  expensesByCategory: { t: 'settings.dashboard.cards.expenses_by_category', code: 'expensesByCategory', isVisible: true },
  transfersByTag: { t: 'settings.dashboard.cards.transfers_by_tag', code: 'transfersByTag', isVisible: true },
  transfersByCategory: { t: 'settings.dashboard.cards.transfers_by_category', code: 'transfersByCategory', isVisible: true },
  todoTransactions: { t: 'settings.dashboard.cards.todo_transactions', code: 'todoTransactions', isVisible: true },
}

export const dashboardCardList = Object.values(dashboardCard)
