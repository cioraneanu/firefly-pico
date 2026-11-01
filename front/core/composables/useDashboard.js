import { capitalize, get } from 'lodash-es'
import { addMonths, differenceInDays, eachDayOfInterval, format, startOfDay, subDays, subMonths } from 'date-fns'
import { formatTimeAgo } from '@vueuse/core'
import RouteConstants from '~/core/constants/RouteConstants'
import { dashboardCard, dashboardCardList } from '~/core/constants/DashboardConstants'
import Category from '~/core/models/Category'
import PiggyBank from '~/core/models/PiggyBank'
import RecurringTransaction from '~/core/models/RecurringTransaction'
import Tag from '~/core/models/Tag'
import { getExcludedTransactionUrl } from '~/core/utils/DashboardUtils'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

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
    todo: () => tagStore.tagTodo && `${RouteConstants.ROUTE_TRANSACTION_LIST}?tag_id=${tagStore.tagTodo.id}`,
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

  const weekBars = computed(() => {
    const max = Math.max(...Object.values(dashboardStore.dashboardExpenseByDay))
    return eachDayOfInterval({ start: subDays(new Date(), 7), end: startOfDay(new Date()) }).map((date) => {
      const amount = get(dashboardStore.dashboardExpenseByDay, DateUtils.dateToString(date), 0)
      return { date, label: capitalize(format(date, 'E')), amount, value: formatNumberForDashboard(amount), percent: (amount / max) * 100 }
    })
  })

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

  return { expensesByTag, transfersByTag, expensesByCategory, transfersByCategory, weekBars, piggyBanks, upcomingRecurring }
}

export function useDashboardSummary() {
  const profileStore = useProfileStore()
  const dashboardStore = useDashboardStore()

  const startDate = computed(() => {
    const date = startOfDay(new Date()).setDate(profileStore.dashboard.firstDayOfMonth)
    return date > new Date() ? subMonths(date, 1) : date
  })

  return {
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
