import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import { useIdbStorage } from '~/utils/IdbStorage.js'
import CurrencyRepository from '~/repository/CurrencyRepository'
import Currency from '~/models/Currency.js'

export const useCurrencyStore = defineStore('currency', () => {
  const exchangeRates = useLocalStorage('exchangeRates', {})
  const currenciesList = useIdbStorage('currenciesList', [])
  const isLoadingCurrencies = ref(false)
  const isLoadingExchangeRates = ref(false)

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

  function applyExchangeRates(rates) {
    exchangeRates.value = rates
  }

  function applyCurrenciesList(list) {
    currenciesList.value = list
  }

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
    currenciesList,
    isLoadingCurrencies,
    isLoadingExchangeRates,
    currencyDictionary,
    defaultCurrency,
    exchangeRatesList,
    applyExchangeRates,
    applyCurrenciesList,
    fetchExchangeRate,
    fetchCurrencies,
  }
})
