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
        <app-list-search v-if="isSearchVisible && list.length > 0" v-model="search">
          <template #right>
            <van-popover v-model:show="showFilterPopover" placement="bottom-end" overlay :overlay-style="{ background: 'transparent' }">
              <div class="display-flex flex-column gap-1 p-10">
                <div class="text-size-12 font-weight-600 text-muted">{{ $t('transaction_type') }}</div>
                <app-tabs v-model="filterTransactionType" :items="transactionTypeTabs" />
              </div>

              <template #reference>
                <button type="button" class="app-button-icon">
                  <app-icon :icon="TablerIconConstants.settings" :size="18" />
                </button>
              </template>
            </van-popover>
          </template>
        </app-list-search>
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
import Transaction from '~/models/Transaction.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const { t } = useI18n()
const recurringTransactionStore = useRecurringTransactionStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    recurringTransactionStore.recurringTransactionList = recurringTransactionStore.recurringTransactionList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')
const isSearchVisible = ref(true)

const showFilterPopover = ref(false)
const filterTransactionType = ref('all')
const transactionTypeTabs = computed(() => [
  { label: t('transaction.type.all'), value: 'all' },
  { label: t('transaction.type.expense'), value: Transaction.types.expense.code },
  { label: t('transaction.type.income'), value: Transaction.types.income.code },
  { label: t('transaction.type.transfer'), value: Transaction.types.transfer.code },
])

const filteredList = computed(() => {
  let result = list.value
  if (filterTransactionType.value !== 'all') {
    result = result.filter((item) => RecurringTransaction.getType(item)?.code === filterTransactionType.value)
  }
  if (search.value.length === 0) {
    return result
  }
  return result.filter((item) => {
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

const toolbar = useToolbar()
toolbar.init({
  title: t('recurring_transactions'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
