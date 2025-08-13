<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isLoadingAccounts" @refresh="onRefresh">
      <div ref="dashboard" class="flex-column display-flex">
        <dashboard-control />

        <dashboard-calendar :style="getStyleForCard(dashboardCard.calendar)" />

        <dashboard-accounts :style="getStyleForCard(dashboardCard.accounts)" />

        <dashboard-week-bars :style="getStyleForCard(dashboardCard.expensesLastWeek)" />

        <dashboard-summary :style="getStyleForCard(dashboardCard.transactionsSummary)" />

        <dashboard-budgets :style="getStyleForCard(dashboardCard.budgets)" />

        <dashboard-tag-expense-totals :style="getStyleForCard(dashboardCard.expensesByTag)" />

        <dashboard-category-expense-totals :style="getStyleForCard(dashboardCard.expensesByCategory)" />

        <dashboard-tag-transfer-totals :style="getStyleForCard(dashboardCard.transfersByTag)" />

        <dashboard-category-transfer-totals :style="getStyleForCard(dashboardCard.transfersByCategory)" />

        <dashboard-todo-transactions :style="getStyleForCard(dashboardCard.todoTransactions)" />

        <app-card-info style="order: 99">
          <app-field-link :label="$t('dashboard.configure_cards')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)" />
        </app-card-info>
      </div>
    </van-pull-refresh>


  </div>
</template>

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { debounce } from 'lodash/function'
import UIUtils from '~/utils/UIUtils.js'
import DashboardTagTotals from '~/components/dashboard/dashboard-tag-expense-totals/dashboard-tag-expense-totals.vue'
import { animateDashboard } from '~/utils/AnimationUtils.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { dashboardCard } from '~/constants/DashboardConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useSwipe } from '@vueuse/core'
import { addMonths } from 'date-fns'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'

const dataStore = useDataStore()
const profileStore = useProfileStore()
const { isLoadingAccounts } = storeToRefs(dataStore)

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

const getStyleForCard = (dashboardCard) => {
  let cardCode = dashboardCard.code
  let position = profileStore.dashboardWidgetsConfig.findIndex((item) => item.code === cardCode)
  let field = profileStore.dashboardWidgetsConfig.find((item) => item.code === cardCode)
  let isVisible = field ? field.isVisible : true
  let displayStyle = isVisible ? '' : 'display: none'

  return `order: ${position}; ${displayStyle}`
}

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
