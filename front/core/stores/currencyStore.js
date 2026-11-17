import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy, omit } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import CurrencyRepository from '~/core/repository/CurrencyRepository'

export const useCurrencyStore = defineStore('currency', () => {
  const exchangeRates = useLocalStorage('exchangeRates', {})
  const currenciesList = useLocalStorage('currenciesList', [])
  const isLoadingCurrencies = ref(false)
  const isLoadingExchangeRates = ref(false)

  const currencyDictionary = computed(() => {
    return keyBy(currenciesList.value, 'id')
  })

  const defaultCurrency = computed(() => {
    return currenciesList.value.find((item) => item?.attributes?.default)
  })

  // The fetched rates with the user's own rates on top: what every conversion uses
  const rates = computed(() => ({ ...exchangeRates.value?.rates, ...useProfileStore().exchangeRateOverrides }))

  const exchangeRatesList = computed(() => {
    let infoList = exchangeRates.value?.currencies ?? []
    let infoDictionary = keyBy(infoList, 'code')

    let fetchedRates = exchangeRates.value?.rates ?? {}
    return Object.keys(rates.value).map((currencyCode) => ({
      code: currencyCode,
      value: rates.value[currencyCode],
      fetchedValue: fetchedRates[currencyCode],
      isCustom: currencyCode in useProfileStore().exchangeRateOverrides,
      isEditable: currencyCode !== 'USD',
      name: infoDictionary?.[currencyCode]?.name ?? ' - ',
      country: infoDictionary?.[currencyCode]?.country ?? ' - ',
    }))
  })

  // value = null goes back to the fetched rate
  async function setExchangeRate(code, value) {
    const profileStore = useProfileStore()
    profileStore.exchangeRateOverrides = value === null ? omit(profileStore.exchangeRateOverrides, code) : { ...profileStore.exchangeRateOverrides, [code]: value }
    await profileStore.writeProfile()
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
    rates,
    exchangeRatesList,
    setExchangeRate,
    fetchExchangeRate,
    fetchCurrencies,
  }
})
