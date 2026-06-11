<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list class="p-1" :finished="isFinished" @load="onLoadMore">
        <currency-list-item v-for="item in sortedList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useCurrencyStore } from '~/stores/currencyStore'
import { ref } from 'vue'
import { useList } from '~/composables/useList'
import { useToolbar } from '~/composables/useToolbar'
import CurrencyListItem from '~/components/list-items/currency-list-item.vue'
import Currency from '~/models/Currency'

const currencyStore = useCurrencyStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    currencyStore.currenciesList = currencyStore.currenciesList.filter((item) => item.id !== payload.id)
  }
}

const { isLoading, isFinished, isRefreshing, page, pageSize, totalPages, listTotalCount, list, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_CURRENCY_LIST,
  routeForm: RouteConstants.ROUTE_CURRENCY_ID,
  model: new Currency(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true

  const currencyStore = useCurrencyStore()
  await currencyStore.fetchCurrencies()

  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = async () => {
  const currencyStore = useCurrencyStore()
  list.value = currencyStore.currenciesList
}

const sortedList = computed(() =>
  [...currencyStore.currenciesList].sort((a, b) => {
    if (a.attributes?.default !== b.attributes?.default) {
      return b.attributes?.default - a.attributes?.default
    }
    if (a.attributes?.enabled !== b.attributes?.enabled) {
      return b.attributes?.enabled - a.attributes?.enabled
    }
    return a.attributes?.code.localeCompare(b.attributes?.code)
  }),
)

// -----

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: t('currencies'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
