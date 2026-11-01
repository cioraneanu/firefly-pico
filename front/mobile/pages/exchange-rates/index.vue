<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-cell-group inset>
        <app-list-search v-model="search" />

        <div class="van-cell-group-title mt-1.25 mb-0">{{ $t('date') }}: {{ exchangeDate }}</div>
        <div class="text-muted text-12 ml-3.75 mb-2.5">{{ $t('exchange_rate_page.relative_to_usd') }}</div>

        <van-grid :column-num="3">
          <van-grid-item v-for="currency in filteredList">
            <template #text>
              <div>
                <div class="flex items-center justify-center text-14 font-semibold">{{ currency.code }}</div>
                <div class="flex items-center justify-center text-10">{{ currency.name }}</div>
                <div class="flex items-center justify-center text-10 text-muted">{{ currency.value }}</div>
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
import { useProfileStore } from '~/core/stores/profileStore'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import UIUtils from '~/core/utils/UIUtils.js'
import AppListSearch from '~/mobile/components/ui-kit/theme/app-list-search.vue'
import Tag from '~/core/models/Tag.js'

const profileStore = useProfileStore()
const currencyStore = useCurrencyStore()

const isRefreshing = ref(false)
const search = ref('')
const isSearchVisible = ref(true)

const exchangeDate = computed(() => get(currencyStore.exchangeRates, 'date'))
const list = computed(() => currencyStore.exchangeRatesList)

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }

  return list.value.filter((item) =>
    ['code', 'name', 'country'].some((key) => {
      return LanguageUtils.includesSearch(item[key], search.value)
    }),
  )
})

const onRefresh = async () => {
  isRefreshing.value = true
  await currencyStore.fetchExchangeRate()
  isRefreshing.value = false
}


const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: t('exchange_rates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
