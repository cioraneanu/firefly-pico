export const dashboardCard = {
  calendar: { t: 'calendar', code: 'calendar', isVisible: true },
  accounts: { t: 'settings.dashboard.cards.accounts_summary', code: 'accounts', isVisible: true },
  expensesLastWeek: { t: 'settings.dashboard.cards.expenses_this_week', code: 'expensesLastWeek', isVisible: true },
  transactionsSummary: { t: 'settings.dashboard.cards.transactions_summary', code: 'transactionSummary', isVisible: true },
  budgets: { t: 'budgets', code: 'budgets', isVisible: true },
  monthProjection: { t: 'settings.dashboard.cards.month_projection', code: 'monthProjection', isVisible: true },
  expensesByTag: { t: 'settings.dashboard.cards.expenses_by_tag', code: 'expensesByTag', isVisible: true },
  expensesByCategory: { t: 'settings.dashboard.cards.expenses_by_category', code: 'expensesByCategory', isVisible: true },
  transfersByTag: { t: 'settings.dashboard.cards.transfers_by_tag', code: 'transfersByTag', isVisible: true },
  transfersByCategory: { t: 'settings.dashboard.cards.transfers_by_category', code: 'transfersByCategory', isVisible: true },
  todoTransactions: { t: 'settings.dashboard.cards.todo_transactions', code: 'todoTransactions', isVisible: true },
  piggyBanks: { t: 'settings.dashboard.cards.piggy_banks', code: 'piggyBanks', isVisible: true },
  recurringTransactions: { t: 'settings.dashboard.cards.recurring_transactions', code: 'recurringTransactions', isVisible: true },
}

export const dashboardCardList = Object.values(dashboardCard)

// Top-N budgets shown as their own line in the Budgets card's pace chart; the rest fold into
// "Other" — same top-N-plus-Other convention as every ranked chart, just a Home-local constant so
// this doesn't have to import anything from the Analytics page.
export const DASHBOARD_BUDGET_PACE_TOP_N = 10

// Trailing complete months averaged for Month projection's "vs. historical average" comparison.
export const DASHBOARD_PROJECTION_HISTORY_MONTHS = 3
