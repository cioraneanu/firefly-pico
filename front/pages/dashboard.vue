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

import { ref, onMounted } from 'vue'; import { useAppStore } from '~/stores/appStore'

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { debounce } from 'lodash/function'
import UIUtils from '~/utils/UIUtils.js'
import DashboardTagTotals from '~/components/dashboard/dashboard-tag-totals/dashboard-tag-totals.vue'

const toolbar = useToolbar()
toolbar.init({ title: 'Dashboard' })

const dataStore = useDataStore()
const appStore = useAppStore()
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
