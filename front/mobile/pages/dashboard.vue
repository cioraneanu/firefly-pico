<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <dashboard-control-buttons />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" finished @refresh="onRefresh">
        <dashboard-control />

        <div ref="dashboard" class="mx-dash-frame" :class="{ back: isDashboardCardsBack }">
          <transition :name="profileStore.showAnimations ? 'mx-dash-slide' : ''" mode="out-in">
            <div :key="+dashboardStore.month" class="mx-body mx-dash-cards">
              <component :is="card.component" v-for="card in visibleCards" :key="card.code" />
            </div>
          </transition>
        </div>

        <app-card-info>
          <app-field-link :label="$t('dashboard.configure_cards')" :icon="IconLayoutDashboard" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)" />
        </app-card-info>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import { useToolbar } from '~/mobile/composables/useToolbar'
import { debounce } from 'lodash-es/function'
import { animateDashboard } from '~/core/utils/AnimationUtils.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import { dashboardCard } from '~/core/constants/DashboardConstants.js'
import { IconLayoutDashboard } from '@tabler/icons-vue'
import { useSwipe } from '@vueuse/core'
import { addMonths } from 'date-fns'
import DashboardCalendar from '~/mobile/components/dashboard/dashboard-calendar/dashboard-calendar.vue'
import DashboardAccounts from '~/mobile/components/dashboard/dashboard-accounts/dashboard-accounts.vue'
import DashboardWeekBars from '~/mobile/components/dashboard/dashboard-week-bars/dashboard-week-bars.vue'
import DashboardSummary from '~/mobile/components/dashboard/dashboard-summary/dashboard-summary.vue'
import DashboardBudgets from '~/mobile/components/dashboard/dashboard-budgets/dashboard-budgets.vue'
import DashboardTagTotalsExpense from '~/mobile/components/dashboard/dashboard-tag-totals-expense/dashboard-tag-totals-expense.vue'
import DashboardCategoryTotalsExpense from '~/mobile/components/dashboard/dashboard-category-totals-expense/dashboard-category-totals-expense.vue'
import DashboardTagTotalsTransfer from '~/mobile/components/dashboard/dashboard-tag-totals-transfer/dashboard-tag-totals-transfer.vue'
import DashboardCategoryTotalsTransfer from '~/mobile/components/dashboard/dashboard-category-totals-transfer/dashboard-category-totals-transfer.vue'
import DashboardTodoTransactions from '~/mobile/components/dashboard/dashboard-todo-transactions/dashboard-todo-transactions.vue'
import DashboardPiggyBanks from '~/mobile/components/dashboard/dashboard-piggy-banks/dashboard-piggy-banks.vue'
import DashboardRecurringTransactions from '~/mobile/components/dashboard/dashboard-recurring-transactions/dashboard-recurring-transactions.vue'

import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()

const cardComponents = {
  [dashboardCard.calendar.code]: DashboardCalendar,
  [dashboardCard.accounts.code]: DashboardAccounts,
  [dashboardCard.expensesLastWeek.code]: DashboardWeekBars,
  [dashboardCard.transactionsSummary.code]: DashboardSummary,
  [dashboardCard.budgets.code]: DashboardBudgets,
  [dashboardCard.expensesByTag.code]: DashboardTagTotalsExpense,
  [dashboardCard.expensesByCategory.code]: DashboardCategoryTotalsExpense,
  [dashboardCard.transfersByTag.code]: DashboardTagTotalsTransfer,
  [dashboardCard.transfersByCategory.code]: DashboardCategoryTotalsTransfer,
  [dashboardCard.todoTransactions.code]: DashboardTodoTransactions,
  [dashboardCard.piggyBanks.code]: DashboardPiggyBanks,
  [dashboardCard.recurringTransactions.code]: DashboardRecurringTransactions,
}

const { visibleCards: cards } = useDashboardCards()
const visibleCards = computed(() => cards.value.map((card) => ({ ...card, component: cardComponents[card.code] })))

const isRefreshing = ref(false)
const isDashboardCardsBack = ref(false)

const onRefresh = async () => {
  isRefreshing.value = true
  await dashboardStore.fetchDashboard()
  isRefreshing.value = false
}

const onRefreshDebounce = debounce(onRefresh, 200)

onMounted(() => {
  animateDashboard()

  if (dashboardStore.transactionsListLastWeek.length > 0) {
    return
  }
  onRefreshDebounce()
})

watch(
  () => dashboardStore.month,
  (newMonth, oldMonth) => {
    if (!oldMonth) return

    isDashboardCardsBack.value = newMonth < oldMonth
  },
)

const dashboard = ref(null)
let swipeStartAt = null
const { lengthX } = useSwipe(dashboard, {
  disableTextSelect: true,

  onSwipeStart(e) {
    swipeStartAt = e.timeStamp
  },
  onSwipeEnd(e) {
    const duration = e.timeStamp - swipeStartAt
    const velocity = Math.abs(lengthX.value) / duration

    if (lengthX.value > 100 && velocity >= 0.5) {
      dashboardStore.month = addMonths(dashboardStore.month, 1)
    }

    if (lengthX.value < -100 && velocity >= 0.5) {
      dashboardStore.month = addMonths(dashboardStore.month, -1)
    }
  },
})

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({ title: t('dashboard.title') })
</script>
