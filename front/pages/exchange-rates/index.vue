<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-cell-group v-if="customRatesList.length > 0" inset>
        <div class="van-cell-group-title mt-5 mb-0">{{ $t('exchange_rate_page.custom_rates') }}</div>
        <div class="text-muted text-size-12 ml-15 mb-10">{{ $t('exchange_rate_page.custom_rates_info') }}</div>

        <van-grid :column-num="2">
          <van-grid-item v-for="customRate in customRatesList" :key="`${customRate.from}_${customRate.to}`">
            <template #text>
              <div>
                <div class="flex-center text-size-14 font-weight-600">{{ customRate.from }} → {{ customRate.to }}</div>
                <div class="flex-center text-size-10 text-muted">{{ customRate.rate }}</div>
              </div>
            </template>
          </van-grid-item>
        </van-grid>
      </van-cell-group>

      <van-cell-group inset>
        <app-list-search v-model="search" />

        <div class="van-cell-group-title mt-5 mb-0">{{ $t('date') }}: {{ exchangeDate }}</div>
        <div class="text-muted text-size-12 ml-15 mb-10">{{ $t('exchange_rate_page.relative_to_usd') }}</div>

        <van-grid :column-num="3">
          <van-grid-item v-for="currency in filteredList" :key="currency.code">
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
import { get } from 'lodash-es'
import { useProfileStore } from '~/stores/profileStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import UIUtils from '~/utils/UIUtils.js'
import AppListSearch from '~/components/ui-kit/theme/app-list-search.vue'
import Tag from '~/models/Tag.js'

const profileStore = useProfileStore()
const currencyStore = useCurrencyStore()

const isRefreshing = ref(false)
const search = ref('')
const isSearchVisible = ref(true)

const exchangeDate = computed(() => get(currencyStore.exchangeRates, 'date'))
const list = computed(() => currencyStore.exchangeRatesList)
const customRatesList = computed(() => currencyStore.userExchangeRates)

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
  await Promise.all([currencyStore.fetchExchangeRate(), currencyStore.fetchUserExchangeRates()])
  isRefreshing.value = false
}


const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: t('exchange_rates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
