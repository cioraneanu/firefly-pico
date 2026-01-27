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
        <dashboard-calendar :style="getStyleForCard(dashboardCard.calendar)" />

        <dashboard-accounts :style="getStyleForCard(dashboardCard.accounts)" />

        <dashboard-week-bars :style="getStyleForCard(dashboardCard.expensesLastWeek)" />

        <dashboard-summary :style="getStyleForCard(dashboardCard.transactionsSummary)" />

        <dashboard-budgets :style="getStyleForCard(dashboardCard.budgets)" />

        <dashboard-tag-totals-expense :style="getStyleForCard(dashboardCard.expensesByTag)" />

        <dashboard-category-totals-expense :style="getStyleForCard(dashboardCard.expensesByCategory)" />

        <dashboard-tag-totals-transfer :style="getStyleForCard(dashboardCard.transfersByTag)" />

        <dashboard-category-totals-transfer :style="getStyleForCard(dashboardCard.transfersByCategory)" />

        <dashboard-todo-transactions :style="getStyleForCard(dashboardCard.todoTransactions)" />
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
import { dashboardCard } from '~/constants/DashboardConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useSwipe } from '@vueuse/core'
import { addMonths } from 'date-fns'

const dataStore = useDataStore()
const appStore = useAppStore()
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

// const dashboardContainerClass = computed(() => {
//   return {
//     'flex-column display-flex': !appStore.isDesktopLayout,
//     'masonry-2-columns': appStore.isDesktopLayout,
//   }
// })

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({ title: t('dashboard.title') })

UIUtils.showLoadingWhen(isLoadingDashboard)
</script>
