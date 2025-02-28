<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isLoadingAccounts" @refresh="onRefresh">
      <div ref="dashboard" class="flex-column display-flex">
        <dashboard-control />

        <dashboard-calendar :style="getStyleForCard(DASHBOARD_SECTIONS.calendar)" />

        <dashboard-accounts :style="getStyleForCard(DASHBOARD_SECTIONS.accounts)" />

        <dashboard-week-bars :style="getStyleForCard(DASHBOARD_SECTIONS.expensesLastWeek)" />

        <dashboard-summary :style="getStyleForCard(DASHBOARD_SECTIONS.transactionSummary)" />

        <dashboard-budgets :style="getStyleForCard(DASHBOARD_SECTIONS.budgets)" />

        <dashboard-tag-totals :style="getStyleForCard(DASHBOARD_SECTIONS.expensesByTag)" />

        <dashboard-category-totals :style="getStyleForCard(DASHBOARD_SECTIONS.expensesByCategory)" />

        <dashboard-todo-transactions :style="getStyleForCard(DASHBOARD_SECTIONS.todosTransactions)" />

        <app-card-info style="order: 99">
          <app-field-link label="Configure cards" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)" />
        </app-card-info>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { debounce } from 'lodash/function'
import UIUtils from '~/utils/UIUtils.js'
import DashboardTagTotals from '~/components/dashboard/dashboard-tag-totals/dashboard-tag-totals.vue'
import anime from 'animejs'
import { animateDashboard } from '~/utils/AnimationUtils.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { FORM_CONSTANTS_TRANSACTION_FIELDS } from '~/constants/FormConstants.js'
import { DASHBOARD_SECTIONS } from '~/constants/DashboardConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useSwipe } from '@vueuse/core'
import { addMonths } from 'date-fns'
import DashboardControlButtons from '~/components/dashboard/dashboard-controls/dashboard-control-buttons.vue'

const toolbar = useToolbar()
toolbar.init({ title: 'Dashboard' })

const dataStore = useDataStore()
const profileStore = useProfileStore()
const { isLoadingAccounts } = storeToRefs(dataStore)

const onRefresh = () => {
  dataStore.fetchAccounts()
  dataStore.fetchDashboardTransactionsForInterval()
  dataStore.fetchDashboardTransactionsForWeek()
  dataStore.fetchTransactionsWithTodos()
  dataStore.fetchExchangeRate()
  dataStore.fetchBudgets()
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

const getStyleForCard = (fieldCode) => {
  let position = profileStore.dashboardWidgetsConfig.findIndex((item) => item.code === fieldCode)
  let field = profileStore.dashboardWidgetsConfig.find((item) => item.code === fieldCode)
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

UIUtils.showLoadingWhen(isLoadingDashboard)
</script>
