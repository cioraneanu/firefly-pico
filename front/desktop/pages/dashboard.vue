<template>
  <d-page :title="$t('dashboard.title')" :description="rangeTitle">
    <template #actions>
      <div class="flex">
        <d-button size="icon" :icon="IconChevronLeft" class="rounded-r-none" @click="onPreviousMonth" />
        <div class="relative z-1 -mx-px w-37 focus-within:z-2 [&>button]:rounded-none">
          <d-select v-model="selectedMonth" :options="monthOptions" :get-meta="(option) => option !== selectedMonth && option.meta" :icon="IconCalendar" />
        </div>
        <d-button size="icon" :icon="IconChevronRight" class="rounded-l-none" @click="onNextMonth" />
      </div>
      <div class="w-28">
        <d-currency-select v-model="dashboardStore.dashboardCurrency" />
      </div>
      <d-button size="icon" :icon="profileStore.dashboard.showAccountAmounts ? IconEye : IconEyeOff" @click="profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts" />
      <d-dash-filters v-model="filters" :active-filters-count />
      <d-refresh-button :action="dashboardStore.fetchDashboard" />
    </template>

    <div v-if="activeFilters.length" class="-mt-2 flex flex-wrap items-center gap-2">
      <span v-for="filter in activeFilters" :key="filter.bagKey" class="inline-flex h-7 items-center overflow-hidden rounded-md border border-line text-[13px]">
        <span class="px-2">{{ filter.display }}</span>
        <button type="button" class="grid h-full cursor-pointer place-items-center border-l border-line px-1.5 text-dim hover:bg-soft hover:text-fg" @click="filters = omit(filters, filter.bagKey)">
          <icon-x :size="14" />
        </button>
      </span>
      <d-button variant="ghost" size="sm" class="text-dim" @click="filters = {}">{{ $t('filters.clear') }}</d-button>
    </div>

    <div class="columns-[460px] gap-4">
      <div v-for="card in visibleCards" :key="card.code" class="mb-4 break-inside-avoid">
        <component :is="cards[card.code]" v-bind="cardProps[card.code]" />
      </div>
    </div>

    <nuxt-link
      :to="RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER"
      class="-mt-2 flex h-11 items-center gap-2.5 rounded-xl border border-dashed border-field px-4 text-sm font-medium text-dim transition-colors hover:bg-soft/50 hover:text-fg"
    >
      <icon-settings :size="16" />
      <span class="flex-1">{{ $t('dashboard.configure_cards') }}</span>
      <icon-chevron-right :size="16" />
    </nuxt-link>
  </d-page>
</template>

<script setup>
import { IconCalendar, IconChevronLeft, IconChevronRight, IconEye, IconEyeOff, IconSettings, IconX } from '@tabler/icons-vue'
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns'
import { omit } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import { dashboardCard } from '~/core/constants/DashboardConstants'
import DashCalendar from '~/desktop/components/dashboard/dash-calendar.vue'
import DashAccounts from '~/desktop/components/dashboard/dash-accounts.vue'
import DashWeek from '~/desktop/components/dashboard/dash-week.vue'
import DashSummary from '~/desktop/components/dashboard/dash-summary.vue'
import DashBudgets from '~/desktop/components/dashboard/dash-budgets.vue'
import DashBars from '~/desktop/components/dashboard/dash-bars.vue'
import DashTodo from '~/desktop/components/dashboard/dash-todo.vue'
import DashPiggyBanks from '~/desktop/components/dashboard/dash-piggy-banks.vue'
import DashRecurring from '~/desktop/components/dashboard/dash-recurring.vue'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const { t } = useI18n()
const { visibleCards } = useDashboardCards()
const { rangeTitle } = useDashboardSummary()
const { expensesByTag, transfersByTag, expensesByCategory, transfersByCategory } = useDashboardBars()
const { onNextMonth, onPreviousMonth } = useDashboardControls()
const { filters, filtersBackendList, activeFilters, activeFiltersCount } = useListFilters({ filterDefinitions: Object.values(TransactionFilterUtils.filters) })

// Next year back to three years ago, newest first
const monthOptions = computed(() =>
  Array.from({ length: 48 }, (_, index) => addMonths(startOfMonth(new Date()), 12 - index)).map((date) => ({
    value: +date,
    label: format(date, 'MMM yyyy'),
    meta: isSameMonth(date, new Date()) ? t('desktop.dashboard.this_month') : null,
  })),
)
const selectedMonth = computed({
  get: () => dashboardStore.month && monthOptions.value.find((option) => option.value === +startOfMonth(dashboardStore.month)),
  set: (option) => (dashboardStore.month = new Date(option.value)),
})

const cards = {
  [dashboardCard.calendar.code]: DashCalendar,
  [dashboardCard.accounts.code]: DashAccounts,
  [dashboardCard.expensesLastWeek.code]: DashWeek,
  [dashboardCard.transactionsSummary.code]: DashSummary,
  [dashboardCard.budgets.code]: DashBudgets,
  [dashboardCard.expensesByTag.code]: DashBars,
  [dashboardCard.expensesByCategory.code]: DashBars,
  [dashboardCard.transfersByTag.code]: DashBars,
  [dashboardCard.transfersByCategory.code]: DashBars,
  [dashboardCard.todoTransactions.code]: DashTodo,
  [dashboardCard.piggyBanks.code]: DashPiggyBanks,
  [dashboardCard.recurringTransactions.code]: DashRecurring,
}

const cardProps = computed(() => ({
  [dashboardCard.expensesByTag.code]: { title: t('dashboard.expenses_by_tags.title'), bars: expensesByTag.value, kind: 'tag', type: 'expense' },
  [dashboardCard.expensesByCategory.code]: { title: t('dashboard.expenses_by_categories'), bars: expensesByCategory.value, kind: 'category', type: 'expense' },
  [dashboardCard.transfersByTag.code]: { title: t('dashboard.transfers_by_tags.title'), bars: transfersByTag.value, kind: 'tag', type: 'transfer' },
  [dashboardCard.transfersByCategory.code]: { title: t('dashboard.transfers_by_categories'), bars: transfersByCategory.value, kind: 'category', type: 'transfer' },
}))

watch(filtersBackendList, (value) => {
  dashboardStore.backendFilters = value
  dashboardStore.fetchDashboard()
})

// Filters start empty on every visit, so drop the ones left in the store by the previous visit
onMounted(() => {
  if (!dashboardStore.backendFilters.length && dashboardStore.transactionsListLastWeek.length) return
  dashboardStore.backendFilters = []
  dashboardStore.fetchDashboard()
})
</script>
