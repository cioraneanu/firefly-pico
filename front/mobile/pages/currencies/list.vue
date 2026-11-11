<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="sortedList.length > 0" v-model="search" :placeholder="$t('currency_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <currency-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="sortedList.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isFinished" :icon="TablerIconConstants.currency" :hint="$t('currency_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('currency_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import { useList } from '~/core/composables/useList'
import { useToolbar } from '~/mobile/composables/useToolbar'
import Currency from '~/core/models/Currency'

const currencyStore = useCurrencyStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    currencyStore.currenciesList = currencyStore.currenciesList.filter((item) => item.id !== payload.id)
  }
}

const { isLoading, isFinished, isRefreshing, list, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_CURRENCY_LIST,
  routeForm: RouteConstants.ROUTE_CURRENCY_ID,
  model: new Currency(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true
  await currencyStore.fetchCurrencies()
  isLoading.value = false
  isRefreshing.value = false
}

// The whole list comes from the store, so one load finishes it
const onLoadMore = () => {
  list.value = currencyStore.currenciesList
  isFinished.value = true
}

// Default first, then enabled, then by code
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

const search = ref('')
const filteredList = computed(() =>
  search.value ? sortedList.value.filter((item) => ['name', 'code'].some((key) => LanguageUtils.includesSearch(get(item, `attributes.${key}`, ''), search.value))) : sortedList.value,
)

const { t } = useI18n()
useToolbar().init({
  title: t('currencies'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
