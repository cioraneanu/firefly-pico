<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #subtitle>
        <dashboard-control-desktop v-if="appStore.isDesktopLayout" />
      </template>
    </app-top-toolbar>

    <van-pull-refresh v-model="isLoadingAccounts" @refresh="onRefresh">
      <dashboard-control v-if="!appStore.isDesktopLayout" />

      <div ref="dashboard" class="dynamic-masonry">
        <component :is="card.component" v-for="card in visibleCards" :key="card.code" />
      </div>

      <app-card-info style="order: 99">
        <app-field-link :label="$t('dashboard.configure_cards')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)" />
      </app-card-info>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { debounce } from 'lodash/function'
import UIUtils from '~/utils/UIUtils.js'
import { animateDashboard } from '~/utils/AnimationUtils.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { dashboardCard, dashboardCardList } from '~/constants/DashboardConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useSwipe } from '@vueuse/core'
import { addMonths } from 'date-fns'
import DashboardCalendar from '~/components/dashboard/dashboard-calendar/dashboard-calendar.vue'
import DashboardAccounts from '~/components/dashboard/dashboard-accounts/dashboard-accounts.vue'
import DashboardWeekBars from '~/components/dashboard/dashboard-week-bars/dashboard-week-bars.vue'
import DashboardSummary from '~/components/dashboard/dashboard-summary/dashboard-summary.vue'
import DashboardBudgets from '~/components/dashboard/dashboard-budgets/dashboard-budgets.vue'
import DashboardTagTotalsExpense from '~/components/dashboard/dashboard-tag-totals-expense/dashboard-tag-totals-expense.vue'
import DashboardCategoryTotalsExpense from '~/components/dashboard/dashboard-category-totals-expense/dashboard-category-totals-expense.vue'
import DashboardTagTotalsTransfer from '~/components/dashboard/dashboard-tag-totals-transfer/dashboard-tag-totals-transfer.vue'
import DashboardCategoryTotalsTransfer from '~/components/dashboard/dashboard-category-totals-transfer/dashboard-category-totals-transfer.vue'
import DashboardTodoTransactions from '~/components/dashboard/dashboard-todo-transactions/dashboard-todo-transactions.vue'

const dataStore = useDataStore()
const appStore = useAppStore()
const profileStore = useProfileStore()
const { isLoadingAccounts } = storeToRefs(dataStore)

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
}

const visibleCards = computed(() => {
  return dashboardCardList
    .map((card) => {
      let position = profileStore.dashboardWidgetsConfig.findIndex((item) => item.code === card.code)
      let field = profileStore.dashboardWidgetsConfig.find((item) => item.code === card.code)
      let isVisible = field ? field.isVisible : true

      return {
        ...card,
        position: position === -1 ? 999 : position,
        isVisible,
        component: cardComponents[card.code],
      }
    })
    .filter((card) => card.isVisible)
    .sort((a, b) => a.position - b.position)
})

const onRefresh = () => {
  dataStore.fetchDashboard()
}

const onRefreshDebounce = debounce(onRefresh, 200)

onMounted(() => {
  animateDashboard()

  if (dataStore.dashboard.transactionsListLastWeek.length > 0) {
    return
  }
  onRefreshDebounce()
})

const isLoadingDashboard = computed(() => {
  return dataStore.isLoadingAccounts || dataStore.isLoadingDashboardTransactions || dataStore.isLoadingDashboardTransactionsLastWeek
})

const dashboard = ref(null)
let swipeStartAt = null
const { lengthX } = useSwipe(dashboard, {
  disableTextSelect: true,

  onSwipeStart(e) {
    swipeStartAt = e.timeStamp
  },
  onSwipeEnd(e, direction) {
    let duration = e.timeStamp - swipeStartAt
    let velocity = Math.abs(lengthX.value) / duration

    if (lengthX.value > 100 && velocity >= 0.5) {
      dataStore.dashboard.month = addMonths(dataStore.dashboard.month, 1)
    }

    if (lengthX.value < -100 && velocity >= 0.5) {
      dataStore.dashboard.month = addMonths(dataStore.dashboard.month, -1)
    }
  },
})


const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({ title: t('dashboard.title') })

UIUtils.showLoadingWhen(isLoadingDashboard)
</script>
