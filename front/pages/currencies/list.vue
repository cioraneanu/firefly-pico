<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <currency-list-item v-for="item in list" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import { ref } from 'vue'
import { useList } from '~/composables/useList'
import { useToolbar } from '~/composables/useToolbar'
import CurrencyListItem from '~/components/list-items/currency-list-item.vue'
import Currency from '~/models/Currency'

const dataStore = useDataStore()

// let list = computed(() => dataStore.accountList)
// let formRoute = RouteConstants.ROUTE_ACCOUNT_ID

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    dataStore.currenciesList = dataStore.currenciesList.filter((item) => item.id !== payload.id)
  }
}

const {
  isLoading,
  isFinished,
  isRefreshing,
  page,
  pageSize,
  totalPages,
  listTotalCount,
  list,
  onAdd,
  onEdit,
  onDelete,
} = useList({
  routeList: RouteConstants.ROUTE_CURRENCY_LIST,
  routeForm: RouteConstants.ROUTE_CURRENCY_ID,
  model: new Currency(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const dataStore = useDataStore()
  await dataStore.fetchCurrencies()

  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = async () => {
  const dataStore = useDataStore()
  list.value = dataStore.currenciesList
}

// -----

const toolbar = useToolbar()
toolbar.init({
  title: 'Currencies list',
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
