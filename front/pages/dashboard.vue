<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #subtitle>
        <dashboard-control-desktop v-if="appStore.isDesktopLayout" />
      </template>
    </app-top-toolbar>

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <dashboard-control v-if="!appStore.isDesktopLayout" />

      <div ref="dashboard" class="dashboard-cards-frame" :class="{ 'dashboard-cards-back': isDashboardCardsBack }">
        <transition :name="profileStore.showAnimations ? 'dashboard-cards' : ''" mode="out-in">
          <div :key="+dashboardStore.month" class="dynamic-masonry">
            <component :is="card.component" v-for="card in visibleCards" :key="card.code" />
          </div>
        </transition>
      </div>

      <app-card-info style="order: 99">
        <app-field-link :label="$t('dashboard.configure_cards')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)" />
      </app-card-info>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { debounce } from 'lodash-es/function'
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
import DashboardPiggyBanks from '~/components/dashboard/dashboard-piggy-banks/dashboard-piggy-banks.vue'
import DashboardRecurringTransactions from '~/components/dashboard/dashboard-recurring-transactions/dashboard-recurring-transactions.vue'

import { useDashboardStore } from '~/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const appStore = useAppStore()
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

const isCardEnabled = (cardCode) => {
  if (cardCode === dashboardCard.budgets.code && !profileStore.budgetsEnabled) return false
  if ([dashboardCard.expensesByTag.code, dashboardCard.transfersByTag.code, dashboardCard.todoTransactions.code].includes(cardCode) && !profileStore.tagsEnabled) return false
  if ([dashboardCard.expensesByCategory.code, dashboardCard.transfersByCategory.code].includes(cardCode) && !profileStore.categoriesEnabled) return false
  if (cardCode === dashboardCard.piggyBanks.code && !profileStore.piggyBanksEnabled) return false
  if (cardCode === dashboardCard.recurringTransactions.code && !profileStore.recurringTransactionsEnabled) return false
  return true
}

const visibleCards = computed(() => {
  return dashboardCardList
    .map((card) => {
      const position = profileStore.dashboardWidgetsConfig.findIndex((item) => item.code === card.code)
      const field = profileStore.dashboardWidgetsConfig.find((item) => item.code === card.code)
      const isVisible = field ? field.isVisible : true

      return {
        ...card,
        position: position === -1 ? 999 : position,
        isVisible,
        component: cardComponents[card.code],
      }
    })
    .filter((card) => card.isVisible && isCardEnabled(card.code))
    .sort((a, b) => a.position - b.position)
})

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

<style scoped>
.dashboard-cards-frame {
  --enter-x: 36px;
  --leave-x: -36px;
  overflow-x: hidden;
}

.dashboard-cards-back {
  --enter-x: -36px;
  --leave-x: 36px;
}

.dashboard-cards-enter-active,
.dashboard-cards-leave-active {
  transition:
    transform 0.22s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.18s ease;
}

.dashboard-cards-enter-from {
  opacity: 0;
  transform: translateX(var(--enter-x));
}

.dashboard-cards-leave-to {
  opacity: 0;
  transform: translateX(var(--leave-x));
}
</style>
