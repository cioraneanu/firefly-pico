<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-cell-group inset>
        <div class="van-cell-group-title">Date: {{ exchangeDate }}</div>

        <van-grid :column-num="3">
          <van-grid-item v-for="(currencyValue, currencyCode) in exchangeRates">
            <template #text>
              <div>
                <div class="flex-center text-size-14 font-weight-600">{{ currencyCode }}</div>
                <div class="flex-center text-size-10 text-muted">{{ currencyValue }}</div>
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
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import UIUtils from '~/utils/UIUtils.js'

const appStore = useAppStore()
const dataStore = useDataStore()

const isRefreshing = ref(false)

const onRefresh = async () => {
  isRefreshing.value = true
  await dataStore.fetchExchangeRate()
  isRefreshing.value = false
}

const exchangeDate = computed(() => get(dataStore.exchangeRates, 'date'))
const exchangeRates = computed(() => get(dataStore.exchangeRates, 'rates'))

const getCurrencyValue = (currency) => {
  console.log('xxxx', exchangeRates.value, currency)
  return get(exchangeRates.value, currency)
}

UIUtils.showLoadingWhen(isRefreshing)

const toolbar = useToolbar()
toolbar.init({
  title: 'Exchange rates',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
