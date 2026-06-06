import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import CurrencyRepository from '~/repository/CurrencyRepository'
import Currency from '~/models/Currency.js'

export const useCurrencyStore = defineStore('currency', () => {
  const exchangeRates = useLocalStorage('exchangeRates', {})
  const dashboardCurrency = useLocalStorage('dashboardCurrency', null, { serializer: StorageSerializers.object })
  const currenciesList = useLocalStorage('currenciesList', [])
  const isLoadingCurrencies = ref(false)
  const isLoadingExchangeRates = ref(false)

  const dashboardCurrencyCode = computed(() => {
    return Currency.getCode(dashboardCurrency.value)
  })

  const currencyDictionary = computed(() => {
    return keyBy(currenciesList.value, 'id')
  })

  const defaultCurrency = computed(() => {
    return currenciesList.value.find((item) => item?.attributes?.default)
  })

  const exchangeRatesList = computed(() => {
    let infoList = exchangeRates.value?.currencies ?? []
    let infoDictionary = keyBy(infoList, 'code')

    let rates = exchangeRates.value?.rates
    return Object.keys(rates ?? {}).map((currencyCode) => ({
      code: currencyCode,
      value: rates[currencyCode],
      name: infoDictionary?.[currencyCode]?.name ?? ' - ',
      country: infoDictionary?.[currencyCode]?.country ?? ' - ',
    }))
  })

  async function fetchExchangeRate() {
    isLoadingExchangeRates.value = true
    exchangeRates.value = await new CurrencyRepository().getCurrencyExchange()
    isLoadingExchangeRates.value = false
  }

  async function fetchCurrencies() {
    isLoadingCurrencies.value = true
    currenciesList.value = await new CurrencyRepository().getAllWithMerge()
    isLoadingCurrencies.value = false
  }

  return {
    exchangeRates,
    dashboardCurrency,
    currenciesList,
    isLoadingCurrencies,
    isLoadingExchangeRates,
    dashboardCurrencyCode,
    currencyDictionary,
    defaultCurrency,
    exchangeRatesList,
    fetchExchangeRate,
    fetchCurrencies,
  }
})
