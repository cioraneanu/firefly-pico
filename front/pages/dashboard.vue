<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isLoadingAccounts" @refresh="onRefresh">
      <dashboard-accounts />

      <dashboard-week-bars />

      <dashboard-summary />

      <dashboard-tag-totals />

      <dashboard-category-totals />

      <dashboard-todo-transactions />
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

UIUtils.showLoadingWhen(isLoadingDashboard)

</script>
