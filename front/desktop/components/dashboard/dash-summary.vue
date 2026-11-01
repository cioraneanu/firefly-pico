<template>
  <d-card :title="$t('dashboard.transactions_summary.title')">
    <div class="grid grid-cols-3 gap-2">
      <d-dash-tile v-for="tile in summary" :key="tile.label" v-bind="tile" />
    </div>
    <h3 class="mb-2.5 mt-[18px] flex items-center gap-2 text-[13px] font-semibold after:h-px after:flex-1 after:bg-line after:content-['']">
      {{ $t('dashboard.transactions_summary.savings_summary') }}
    </h3>
    <div class="grid grid-cols-3 gap-2">
      <d-dash-tile v-for="tile in savings" :key="tile.label" v-bind="tile" />
    </div>
  </d-card>
</template>

<script setup>
import { IconCalendarEvent, IconChartPie, IconCoin, IconHash, IconSquareRoundedMinus, IconSquareRoundedPlus, IconArrowsRightLeft, IconTriangle } from '@tabler/icons-vue'
import { differenceInDays, startOfDay } from 'date-fns'
import Currency from '~/core/models/Currency'
import Transaction from '~/core/models/Transaction'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const { periodDays, elapsedDays } = useDashboardSummary()

const money = (value) => `${formatNumberForDashboard(value)} ${Currency.getSymbol(dashboardStore.dashboardCurrency)}`
// Days left in the selected period: none for past months, all of them for future ones
const remainingDays = computed(() => Math.min(Math.max(differenceInDays(dashboardStore.dashboardDateEnd, startOfDay(new Date())) + 1, 0), periodDays.value))
const income = computed(() => dashboardStore.totalIncomeThisMonth)
const ofIncome = (value) => (income.value ? (value / income.value) * 100 : 0)

const summary = computed(() => {
  const expense = dashboardStore.totalExpenseThisMonth
  const surplus = dashboardStore.totalSurplusThisMonth
  const count = dashboardStore.totalTransactionsCount
  const elapsed = elapsedDays.value
  return [
    {
      label: t('transaction.type.income'),
      icon: IconSquareRoundedPlus,
      value: money(income.value),
      tone: 'income',
      meter: income.value ? 100 : 0,
      hint: elapsed ? t('desktop.dashboard.per_day', { amount: money(income.value / elapsed) }) : t('desktop.dashboard.no_days_yet'),
      to: links.byType(Transaction.types.income),
    },
    {
      label: t('transaction.type.expense'),
      icon: IconSquareRoundedMinus,
      value: money(expense),
      tone: 'expense',
      meter: ofIncome(expense),
      hint: t('desktop.dashboard.of_income', { percent: Math.round(ofIncome(expense)) }),
      to: links.byType(Transaction.types.expense),
    },
    {
      label: t('transaction.type.transfer'),
      icon: IconArrowsRightLeft,
      value: money(dashboardStore.totalTransfersThisMonth),
      tone: 'transfer',
      meter: ofIncome(dashboardStore.totalTransfersThisMonth),
      hint: t('desktop.dashboard.of_income', { percent: Math.round(ofIncome(dashboardStore.totalTransfersThisMonth)) }),
      to: links.byType(Transaction.types.transfer),
    },
    {
      label: t('dashboard.transactions_summary.surplus'),
      icon: IconTriangle,
      value: money(surplus),
      meter: ofIncome(surplus),
      hint: surplus < 0 ? t('desktop.dashboard.more_out_than_in') : t('desktop.dashboard.income_kept', { percent: Math.round(ofIncome(surplus)) }),
    },
    {
      label: t('toolbar.transactions'),
      icon: IconHash,
      value: count,
      meter: (elapsed / periodDays.value) * 100,
      hint: !elapsed
        ? t('desktop.dashboard.month_not_started')
        : elapsed < periodDays.value
          ? t('desktop.dashboard.on_pace_for', { count: Math.round((count / elapsed) * periodDays.value) })
          : t('desktop.dashboard.whole_month'),
    },
    {
      label: t('desktop.dashboard.days_left'),
      icon: IconCalendarEvent,
      value: remainingDays.value,
      meter: (remainingDays.value / periodDays.value) * 100,
      hint: t('desktop.dashboard.of_days', { count: periodDays.value }),
    },
  ]
})

const savings = computed(() => {
  const amount = dashboardStore.transactionsListSavingsAmount
  return [
    {
      label: t('toolbar.transactions'),
      icon: IconHash,
      value: dashboardStore.transactionsListSavingsCount,
      meter: 0,
      hint: t('desktop.dashboard.to_savings_accounts'),
      to: dashboardStore.transactionsListSavings.length ? links.savings() : null,
    },
    {
      label: t('amount'),
      icon: IconCoin,
      value: money(amount),
      tone: amount < 0 ? 'expense' : 'income',
      meter: ofIncome(amount),
      hint: t('desktop.dashboard.of_income_amount', { amount: money(income.value) }),
    },
    {
      label: t('percentage'),
      icon: IconChartPie,
      value: `${Math.trunc(dashboardStore.transactionsListSavingsPercentage)} %`,
      tone: 'transfer',
      meter: ofIncome(amount),
      hint: t('desktop.dashboard.of_income_saved'),
    },
  ]
})
</script>
