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
        <recurring-transaction-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import { useList } from '~/composables/useList'
import { useToolbar } from '~/composables/useToolbar'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import { animateSwipeList } from '~/utils/AnimationUtils.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'

const recurringTransactionStore = useRecurringTransactionStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    recurringTransactionStore.recurringTransactionList = recurringTransactionStore.recurringTransactionList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')
const isSearchVisible = ref(true)

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((item) => {
    return RecurringTransaction.getDisplayName(item).toUpperCase().indexOf(search.value.toUpperCase()) !== -1
  })
})

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  title: 'Recurring transactions list',
  routeList: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_RECURRING_TRANSACTION_ID,
  model: new RecurringTransaction(),
  onEvent: onEvent,
})

const formClass = computed(() => ({
  'app-form': true,
  empty: isEmpty.value,
}))

const onRefresh = async () => {
  if (isLoading.value) {
    isRefreshing.value = false
    return
  }
  isLoading.value = true
  isRefreshing.value = true

  await recurringTransactionStore.fetchRecurringTransactions()
  list.value = recurringTransactionStore.recurringTransactionList

  // The whole list is fetched in one go => stop van-list from requesting more pages on scroll
  isFinished.value = true
  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = () => {
  onRefresh()
}

// -----

const { t } = useI18n()
const toolbar = useToolbar()
toolbar.init({
  title: t('recurring_transactions'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
