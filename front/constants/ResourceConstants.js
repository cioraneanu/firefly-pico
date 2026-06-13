import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { dashboardCard } from '~/constants/DashboardConstants.js'
import { transactionFormField, transactionListField } from '~/constants/TransactionConstants.js'

// Non-required resources which the user can toggle off entirely.
// Disabling one hides its dashboard cards, its transaction form/list inputs and
// skips loading its data from the backend.
export const resource = {
  budgets: { t: 'settings.setup.budgets', code: 'budgets', icon: TablerIconConstants.budget, isEnabled: true },
  categories: { t: 'settings.setup.categories', code: 'categories', icon: TablerIconConstants.category, isEnabled: true },
  tags: { t: 'settings.setup.tags', code: 'tags', icon: TablerIconConstants.tag, isEnabled: true },
  piggyBanks: { t: 'settings.setup.piggy_banks', code: 'piggyBanks', icon: TablerIconConstants.piggyBank, isEnabled: true },
  recurringTransactions: { t: 'settings.setup.recurring_transactions', code: 'recurringTransactions', icon: TablerIconConstants.recurringTransaction, isEnabled: true },
}

export const resourceList = Object.values(resource)

// Maps a dashboard card code -> the resource code which gates it
export const dashboardCardResourceMap = {
  [dashboardCard.budgets.code]: resource.budgets.code,
  [dashboardCard.piggyBanks.code]: resource.piggyBanks.code,
  [dashboardCard.recurringTransactions.code]: resource.recurringTransactions.code,
  [dashboardCard.expensesByTag.code]: resource.tags.code,
  [dashboardCard.transfersByTag.code]: resource.tags.code,
  [dashboardCard.expensesByCategory.code]: resource.categories.code,
  [dashboardCard.transfersByCategory.code]: resource.categories.code,
}

// Maps a transaction form/list field code -> the resource code which gates it
export const fieldResourceMap = {
  [transactionFormField.category.code]: resource.categories.code,
  [transactionFormField.budget.code]: resource.budgets.code,
  [transactionFormField.tags.code]: resource.tags.code,
  [transactionFormField.piggyBank.code]: resource.piggyBanks.code,
  [transactionListField.category.code]: resource.categories.code,
  [transactionListField.budget.code]: resource.budgets.code,
  [transactionListField.tags.code]: resource.tags.code,
}
