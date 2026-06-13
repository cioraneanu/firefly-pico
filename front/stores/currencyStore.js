import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get, keyBy } from 'lodash-es'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import CurrencyRepository from '~/repository/CurrencyRepository'
import Currency from '~/models/Currency.js'

export const useCurrencyStore = defineStore('currency', () => {
  const exchangeRates = useLocalStorage('exchangeRates', {})
  // User-defined rates configured in Firefly III, normalized to { from, to, rate, date }.
  const userExchangeRates = useLocalStorage('userExchangeRates', [])
  const currenciesList = useLocalStorage('currenciesList', [])
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

  // Latest user-defined rate per directional currency pair, keyed as `${from}_${to}`.
  const userExchangeRatesDictionary = computed(() => {
    const sorted = [...userExchangeRates.value].sort((a, b) => `${a.date}`.localeCompare(`${b.date}`))
    return sorted.reduce((result, item) => {
      // Newer dates come last and intentionally overwrite older ones.
      result[`${item.from}_${item.to}`] = item.rate
      return result
    }, {})
  })

  // The external (USD anchored) rate table, augmented with currencies that only exist in the
  // user-defined rates (e.g. reward points). Each value is "units of that currency per 1 USD".
  // We propagate user rates onto any currency missing from the base table so that the regular
  // triangulation in convertCurrency keeps working for custom currencies as well.
  const effectiveExchangeRates = computed(() => {
    const base = exchangeRates.value?.rates ?? {}
    const result = {}
    for (const code of Object.keys(base)) {
      const value = parseFloat(base[code])
      if (Number.isFinite(value)) {
        result[code] = value
      }
    }

    const pairs = userExchangeRates.value
    let changed = true
    let guard = 0
    // Iterate so chains (A->B, B->C) can resolve even if listed out of order.
    while (changed && guard < 10) {
      changed = false
      guard++
      for (const { from, to, rate } of pairs) {
        if (!Number.isFinite(rate) || rate === 0) {
          continue
        }
        const hasFrom = Number.isFinite(result[from])
        const hasTo = Number.isFinite(result[to])
        // rate = "how many `to` for 1 `from`", values are "units per 1 USD".
        if (hasFrom && !hasTo) {
          result[to] = rate * result[from]
          changed = true
        } else if (hasTo && !hasFrom) {
          result[from] = result[to] / rate
          changed = true
        }
      }
    }

    return result
  })

  async function fetchExchangeRate() {
    isLoadingExchangeRates.value = true
    exchangeRates.value = await new CurrencyRepository().getCurrencyExchange()
    isLoadingExchangeRates.value = false
  }

  async function fetchUserExchangeRates() {
    const list = await new CurrencyRepository().getUserExchangeRates()
    userExchangeRates.value = list
      .map((item) => ({
        from: get(item, 'attributes.from_currency_code'),
        to: get(item, 'attributes.to_currency_code'),
        rate: parseFloat(get(item, 'attributes.rate')),
        date: get(item, 'attributes.date'),
      }))
      .filter((item) => item.from && item.to && Number.isFinite(item.rate))
  }

  async function fetchCurrencies() {
    isLoadingCurrencies.value = true
    currenciesList.value = await new CurrencyRepository().getAllWithMerge()
    isLoadingCurrencies.value = false
  }

  return {
    exchangeRates,
    userExchangeRates,
    currenciesList,
    isLoadingCurrencies,
    isLoadingExchangeRates,
    currencyDictionary,
    defaultCurrency,
    exchangeRatesList,
    userExchangeRatesDictionary,
    effectiveExchangeRates,
    fetchExchangeRate,
    fetchUserExchangeRates,
    fetchCurrencies,
  }
})
