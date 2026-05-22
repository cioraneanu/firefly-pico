import { defineStore } from 'pinia'
import { keyBy } from 'lodash-es'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import CurrencyRepository from '~/repository/CurrencyRepository'
import Currency from '~/models/Currency.js'

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    exchangeRates: useLocalStorage('exchangeRates', {}),
    dashboardCurrency: useLocalStorage('dashboardCurrency', null, { serializer: StorageSerializers.object }),
    currenciesList: useLocalStorage('currenciesList', []),
    isLoadingCurrencies: false,
    isLoadingExchangeRates: false,
  }),

  getters: {
    dashboardCurrencyCode: (state) => Currency.getCode(state.dashboardCurrency),
    currencyDictionary: (state) => keyBy(state.currenciesList, 'id'),
    defaultCurrency: (state) => state.currenciesList.find((item) => item?.attributes?.default),
    exchangeRatesList: (state) => {
      let infoList = state.exchangeRates?.currencies ?? []
      let infoDictionary = keyBy(infoList, 'code')

      let rates = state.exchangeRates?.rates
      return Object.keys(rates ?? {}).map((currencyCode) => ({
        code: currencyCode,
        value: rates[currencyCode],
        name: infoDictionary?.[currencyCode]?.name ?? ' - ',
        country: infoDictionary?.[currencyCode]?.country ?? ' - ',
      }))
    },
  },

  actions: {
    async fetchExchangeRate() {
      this.isLoadingExchangeRates = true
      this.exchangeRates = await new CurrencyRepository().getCurrencyExchange()
      this.isLoadingExchangeRates = false
    },
    async fetchCurrencies() {
      this.isLoadingCurrencies = true
      this.currenciesList = await new CurrencyRepository().getAllWithMerge()
      this.isLoadingCurrencies = false
    },
  },
})
