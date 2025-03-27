<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-cell-group inset>
        <app-list-search v-model="search" />

        <div class="van-cell-group-title mt-5 mb-0">{{ $t('date') }}: {{ exchangeDate }}</div>
        <div class="text-muted text-size-12 ml-15 mb-10">{{ $t('exchange_rate_page.relative_to_usd') }}</div>

        <van-grid :column-num="3">
          <van-grid-item v-for="currency in filteredList">
            <template #text>
              <div>
                <div class="flex-center text-size-14 font-weight-600">{{ currency.code }}</div>
                <div class="flex-center text-size-10">{{ currency.name }}</div>
                <div class="flex-center text-size-10 text-muted">{{ currency.value }}</div>
              </div>
            </template>
          </van-grid-item>
        </van-grid>
      </van-cell-group>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { get } from 'lodash'
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import UIUtils from '~/utils/UIUtils.js'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import Tag from '~/models/Tag.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const isRefreshing = ref(false)
const search = ref('')
const isSearchVisible = ref(true)

const exchangeDate = computed(() => get(dataStore.exchangeRates, 'date'))
const list = computed(() => dataStore.exchangeRatesList)

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }

  return list.value.filter((item) =>
    ['code', 'name', 'country'].some((key) => {
      return (item[key] ?? '').toLowerCase().includes(search.value.toLowerCase())
    }),
  )
})

const onRefresh = async () => {
  isRefreshing.value = true
  await dataStore.fetchExchangeRate()
  isRefreshing.value = false
}

UIUtils.showLoadingWhen(isRefreshing)

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: t('exchange_rates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
