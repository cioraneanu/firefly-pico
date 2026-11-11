<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <template v-if="list.length > 0">
          <app-list-search v-model="search" :placeholder="$t('recurring_transaction_page.search')" />

          <div class="mx-tabs" role="tablist" :aria-label="$t('transaction_type')">
            <button
              v-for="tab in transactionTypeTabs"
              :key="tab.value"
              type="button"
              role="tab"
              :class="{ on: tab.value === filterTransactionType }"
              :aria-selected="tab.value === filterTransactionType"
              @click="filterTransactionType = tab.value"
            >
              <span>{{ tab.label }}</span>
              <span class="n">{{ tab.count }}</span>
            </button>
          </div>
        </template>

        <div v-if="filteredList.length > 0" class="mx-list">
          <recurring-transaction-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="onClearFilters">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.recurringTransaction" :hint="$t('recurring_transaction_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('recurring_transaction_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useRecurringTransactionStore } from '~/core/stores/recurringTransactionStore'
import { useList } from '~/core/composables/useList'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'
import RecurringTransaction from '~/core/models/RecurringTransaction.js'
import Transaction from '~/core/models/Transaction.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const { t } = useI18n()
const recurringTransactionStore = useRecurringTransactionStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    recurringTransactionStore.recurringTransactionList = recurringTransactionStore.recurringTransactionList.filter((item) => item.id !== payload.id)
  }
}

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_RECURRING_TRANSACTION_ID,
  model: new RecurringTransaction(),
  onEvent: onEvent,
})

const search = ref('')
const filterTransactionType = ref('all')
const getTypeCode = (item) => RecurringTransaction.getType(item)?.code

const transactionTypeTabs = computed(() => [
  { label: t('transaction.type.all'), value: 'all', count: list.value.length },
  ...[Transaction.types.expense, Transaction.types.income, Transaction.types.transfer].map((type) => ({
    label: t(type.t),
    value: type.code,
    count: list.value.filter((item) => getTypeCode(item) === type.code).length,
  })),
])

const filteredList = computed(() => {
  let result = list.value
  if (filterTransactionType.value !== 'all') {
    result = result.filter((item) => getTypeCode(item) === filterTransactionType.value)
  }
  if (search.value.length > 0) {
    result = result.filter((item) => LanguageUtils.includesSearch(RecurringTransaction.getDisplayName(item), search.value))
  }
  return result
})

const onClearFilters = () => {
  search.value = ''
  filterTransactionType.value = 'all'
}

// The whole list is fetched in one go, so one load finishes it
const onRefresh = async () => {
  if (isLoading.value) {
    isRefreshing.value = false
    return
  }
  isLoading.value = true
  isRefreshing.value = true

  await recurringTransactionStore.fetchRecurringTransactions()
  list.value = recurringTransactionStore.recurringTransactionList

  isFinished.value = true
  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = () => onRefresh()

useToolbar().init({
  title: t('recurring_transactions'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
