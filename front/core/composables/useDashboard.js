import { capitalize, get } from 'lodash-es'
import { addDays, addMonths, differenceInDays, eachDayOfInterval, format, min, startOfDay, subDays, subMonths } from 'date-fns'
import { formatTimeAgo } from '@vueuse/core'
import RouteConstants from '~/core/constants/RouteConstants'
import { dashboardCard, dashboardCardList } from '~/core/constants/DashboardConstants'
import Category from '~/core/models/Category'
import PiggyBank from '~/core/models/PiggyBank'
import RecurringTransaction from '~/core/models/RecurringTransaction'
import Subscription from '~/core/models/Subscription'
import Tag from '~/core/models/Tag'
import { getExcludedTransactionUrl } from '~/core/utils/DashboardUtils'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'
import { getReminders, subscriptionState } from '~/core/utils/SubscriptionUtils'

export function useDashboardCards() {
  const profileStore = useProfileStore()

  const isCardEnabled = (code) =>
    ({
      [dashboardCard.budgets.code]: profileStore.budgetsEnabled,
      [dashboardCard.expensesByTag.code]: profileStore.tagsEnabled,
      [dashboardCard.transfersByTag.code]: profileStore.tagsEnabled,
      [dashboardCard.todoTransactions.code]: profileStore.tagsEnabled,
      [dashboardCard.expensesByCategory.code]: profileStore.categoriesEnabled,
      [dashboardCard.transfersByCategory.code]: profileStore.categoriesEnabled,
      [dashboardCard.piggyBanks.code]: profileStore.piggyBanksEnabled,
      [dashboardCard.recurringTransactions.code]: profileStore.recurringTransactionsEnabled,
      [dashboardCard.subscriptions.code]: profileStore.subscriptionsEnabled,
    })[code] ?? true

  const visibleCards = computed(() =>
    dashboardCardList
      .map((card) => {
        const position = profileStore.dashboardWidgetsConfig.findIndex((item) => item.code === card.code)
        const config = profileStore.dashboardWidgetsConfig[position]
        return { ...card, position: position === -1 ? 999 : position, isVisible: config ? config.isVisible : true }
      })
      .filter((card) => card.isVisible && isCardEnabled(card.code))
      .sort((a, b) => a.position - b.position),
  )

  return { visibleCards, isCardEnabled }
}

export function useDashboardLinks() {
  const dashboardStore = useDashboardStore()
  const tagStore = useTagStore()

  const transactions = (params) => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${params.filter(Boolean).join('&')}${getExcludedTransactionUrl()}`
  const period = () => [`date_start=${DateUtils.dateToString(dashboardStore.dashboardDateStart)}`, `date_end=${DateUtils.dateToString(dashboardStore.dashboardDateEnd)}`]
  const typeParam = (type) => type && `type=${type.code}`

  return {
    byType: (type) => transactions([TransactionFilterUtils.filters.transactionType.toUrl(type), ...period()]),
    byDay: (date, type) =>
      transactions([TransactionFilterUtils.filters.dateAfter.toUrl(date), TransactionFilterUtils.filters.dateBefore.toUrl(date), type && TransactionFilterUtils.filters.transactionType.toUrl(type)]),
    byTag: (tag, type) => transactions([tag ? `tag_id=${tag.id}` : 'without_tag=true', ...period(), typeParam(type)]),
    byCategory: (category, type) => transactions([category ? `category_id=${category.id}` : 'without_category=true', ...period(), typeParam(type)]),
    savings: () => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.id.toUrl(dashboardStore.transactionsListSavings.map((item) => item.id).join(','))}`,
    todo: () => tagStore.tagTodo && RouteConstants.ROUTE_TODO,
  }
}

export function useDashboardBars() {
  const { t } = useI18n()
  const dashboardStore = useDashboardStore()
  const tagStore = useTagStore()
  const categoryStore = useCategoryStore()
  const piggyBankStore = usePiggyBankStore()
  const recurringTransactionStore = useRecurringTransactionStore()

  const toBars = (dictionary, key, resolve, label) => {
    const max = Math.max(...Object.values(dictionary))
    return Object.entries(dictionary)
      .map(([id, amount]) => {
        const item = resolve(id)
        return { [key]: item, id, label: item ? label(item) : t('not_set'), amount, value: formatNumberForDashboard(amount), percent: (amount / max) * 100 }
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 15)
  }

  const tagBars = (dictionary) =>
    toBars(
      dictionary,
      'tag',
      (id) => tagStore.tagDictionaryById[id],
      (tag) => Tag.getDisplayNameEllipsized(tag),
    )
  const categoryBars = (dictionary) =>
    toBars(
      dictionary,
      'category',
      (id) => categoryStore.categoryDictionary[id],
      (category) => Category.getDisplayName(category),
    )

  const expensesByTag = computed(() => tagBars(dashboardStore.dashboardExpensesByTag))
  const transfersByTag = computed(() => tagBars(dashboardStore.dashboardTransfersByTag))
  const expensesByCategory = computed(() => categoryBars(dashboardStore.dashboardExpensesByCategory))
  const transfersByCategory = computed(() => categoryBars(dashboardStore.dashboardTransfersByCategory))

  const expenseOnDay = (date) => get(dashboardStore.dashboardExpenseByDay, DateUtils.dateToString(date), 0)

  const weekBars = computed(() => {
    const dates = eachDayOfInterval({ start: subDays(new Date(), 7), end: startOfDay(new Date()) })
    const max = Math.max(...dates.map(expenseOnDay))
    return dates.map((date) => {
      const amount = expenseOnDay(date)
      return { date, label: capitalize(format(date, 'E')), amount, value: formatNumberForDashboard(amount), percent: (amount / max) * 100 }
    })
  })

  // The 8 days before weekBars, fetched along with them by fetchTransactionsForWeek()
  const previousWeekTotal = computed(() => eachDayOfInterval({ start: subDays(new Date(), 15), end: subDays(startOfDay(new Date()), 8) }).reduce((sum, date) => sum + expenseOnDay(date), 0))

  const piggyBanks = computed(() =>
    piggyBankStore.piggyBankList
      .map((piggyBank) => ({ piggyBank, label: PiggyBank.getDisplayName(piggyBank), value: formatNumberForDashboard(PiggyBank.getCurrentAmount(piggyBank)), percent: PiggyBank.getPercent(piggyBank) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 15),
  )

  const upcomingRecurring = computed(() =>
    recurringTransactionStore.recurringTransactionList
      .filter((recurring) => RecurringTransaction.isActive(recurring))
      .flatMap((recurring) =>
        RecurringTransaction.getOccurrences(recurring).map((date) => ({
          recurringTransaction: recurring,
          label: RecurringTransaction.getDisplayName(recurring),
          date,
          timeAgo: capitalize(formatTimeAgo(date)),
          dateFormatted: DateUtils.dateToUI(date),
          amount: formatNumberForDashboard(RecurringTransaction.getAmount(recurring)),
          currencySymbol: RecurringTransaction.getCurrencySymbol(recurring),
          type: RecurringTransaction.getType(recurring),
        })),
      )
      .sort((a, b) => a.date - b.date)
      .slice(0, 6),
  )

  return { expensesByTag, transfersByTag, expensesByCategory, transfersByCategory, weekBars, previousWeekTotal, piggyBanks, upcomingRecurring }
}

export function useDashboardSummary() {
  const profileStore = useProfileStore()
  const dashboardStore = useDashboardStore()

  const startDate = computed(() => {
    const date = startOfDay(new Date()).setDate(profileStore.dashboard.firstDayOfMonth)
    return date > new Date() ? subMonths(date, 1) : date
  })

  const periodDays = computed(() => differenceInDays(dashboardStore.dashboardDateEnd, dashboardStore.dashboardDateStart) + 1)

  return {
    periodDays,
    elapsedDays: computed(() => Math.min(Math.max(differenceInDays(startOfDay(new Date()), dashboardStore.dashboardDateStart) + 1, 0), periodDays.value)),
    remainingDays: computed(() => differenceInDays(subDays(addMonths(startDate.value, 1), 1), startOfDay(new Date())) + 1),
    rangeTitle: computed(() => `${DateUtils.dateToUI(dashboardStore.dashboardDateStart)} - ${DateUtils.dateToUI(dashboardStore.dashboardDateEnd)}`),
    totalExpenseFormatted: computed(() => formatNumberForDashboard(dashboardStore.totalExpenseThisMonth)),
    totalIncomeFormatted: computed(() => formatNumberForDashboard(dashboardStore.totalIncomeThisMonth)),
    totalTransferFormatted: computed(() => formatNumberForDashboard(dashboardStore.totalTransfersThisMonth)),
    totalSurplusFormatted: computed(() => formatNumberForDashboard(dashboardStore.totalSurplusThisMonth)),
    transactionsListSavingsAmount: computed(() => formatNumberForDashboard(dashboardStore.transactionsListSavingsAmount)),
    savingsPercentFormatted: computed(() => `${Math.trunc(dashboardStore.transactionsListSavingsPercentage)} %`),
  }
}

// One row per subscription expected or paid in the selected month, plus contract reminders for the next 30 days
export function useDashboardSubscriptions() {
  const dashboardStore = useDashboardStore()
  const subscriptionStore = useSubscriptionStore()
  const { toDashboardCurrency, currencySymbol } = useSubscriptionTotals()
  const stateOrder = { [subscriptionState.missed]: 0, [subscriptionState.due]: 1, [subscriptionState.paid]: 2 }

  // Firefly >= 6.2 sends each payment's amount; older versions only the date
  const getPaidAmount = (subscription, paidDates, average) =>
    paidDates.every((paidDate) => paidDate.amount !== undefined)
      ? paidDates.reduce((sum, paidDate) => sum + toDashboardCurrency(Math.abs(parseFloat(paidDate.amount) || 0), paidDate.currency_code ?? Subscription.getCurrencyCode(subscription)), 0)
      : average * paidDates.length

  const rows = computed(() => {
    // Past months count as fully passed, the current one up to today
    const today = min([new Date(), addDays(dashboardStore.dashboardDateEnd ?? new Date(), 1)])
    return dashboardStore.dashboardSubscriptionList
      .map((subscription) => ({ subscription, status: Subscription.getMonthStatus(subscription, today) }))
      .filter(({ status }) => status)
      .map(({ subscription, status }) => {
        const average = toDashboardCurrency(Subscription.getAverageAmount(subscription), Subscription.getCurrencyCode(subscription))
        const paidAmount = getPaidAmount(subscription, get(subscription, 'attributes.paid_dates') ?? [], average)
        const expectedAmount = average * status.expected
        return {
          ...status,
          subscription,
          label: Subscription.getDisplayName(subscription),
          // Paid rows have no next date this month: show when it was due
          dateFormatted: DateUtils.dateToUI(status.nextDate ?? DateUtils.autoToDate((get(subscription, 'attributes.pay_dates') ?? []).at(-1))),
          paidAmount,
          expectedAmount,
          amount: formatNumberForDashboard(status.expected ? expectedAmount : paidAmount),
        }
      })
      .sort((a, b) => stateOrder[a.state] - stateOrder[b.state] || (a.nextDate ?? 0) - (b.nextDate ?? 0))
  })

  const expectedRows = computed(() => rows.value.filter((row) => row.expected > 0))
  const summary = computed(() => ({
    paidCount: expectedRows.value.filter((row) => row.state === subscriptionState.paid).length,
    expectedCount: expectedRows.value.length,
    paidAmount: formatNumberForDashboard(rows.value.reduce((sum, row) => sum + row.paidAmount, 0)),
    expectedAmount: formatNumberForDashboard(expectedRows.value.reduce((sum, row) => sum + row.expectedAmount, 0)),
  }))

  const reminders = computed(() =>
    getReminders(subscriptionStore.subscriptionList, new Date()).map((reminder) => ({
      ...reminder,
      label: Subscription.getDisplayName(reminder.subscription),
      dateFormatted: DateUtils.dateToUI(reminder.date),
    })),
  )

  const transactionsRoute = (subscription) => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.subscription.toUrl(subscription)}`

  return { rows, summary, reminders, currencySymbol, transactionsRoute }
}
