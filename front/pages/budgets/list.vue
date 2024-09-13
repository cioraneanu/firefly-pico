<template>
  <div :class="formClass">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <empty-list v-if="isEmpty" />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <app-list-search v-if="isSearchVisible && list.length > 0" v-model="search" />

        <budget-list-item v-for="item in filteredList" :key="item.id" :value="item" @onEdit="onEdit" @onDelete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import { useList } from '~/composables/useList'
import { useToolbar } from '~/composables/useToolbar'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import Budget from '~/models/Budget.js'

let dataStore = useDataStore()

// let list = computed(() => dataStore.accountList)
// let formRoute = RouteConstants.ROUTE_ACCOUNT_ID

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    dataStore.budgetList = dataStore.budgetList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')
const isSearchVisible = ref(true)
const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return Budget.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  title: 'Budgets list',
  routeList: RouteConstants.ROUTE_BUDGET_LIST,
  routeForm: RouteConstants.ROUTE_BUDGET_ID,
  model: new Budget(),
  onEvent: onEvent,
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const dataStore = useDataStore()
  await dataStore.fetchBudgets()

  isLoading.value = false
  isRefreshing.value = false

  onLoadMore()
}

const onLoadMore = () => {
  const dataStore = useDataStore()
  list.value = dataStore.budgetList
}

// -----

const toolbar = useToolbar()
toolbar.init({
  title: 'Budgets list',
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
