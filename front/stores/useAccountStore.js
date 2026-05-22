import { defineStore } from 'pinia'
import { keyBy, head } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import DateUtils from '~/utils/DateUtils.js'
import { startOfTomorrow } from 'date-fns/startOfTomorrow'

export const useAccountStore = defineStore('account', {
  state: () => ({
    accountList: useLocalStorage('accountList', []),
    isLoadingAccounts: false,
  }),

  getters: {
    accountDictionary: (state) => keyBy(state.accountList, 'id'),
  },

  actions: {
    async fetchAccounts(dashboardCurrency) {
      this.isLoadingAccounts = true
      let filters = [{ field: 'date', value: DateUtils.dateToString(startOfTomorrow()) }]
      let list = await new AccountRepository().getAllWithMerge({ filters })
      const allowedTypes = [Account.types.asset, Account.types.expense, Account.types.revenue, Account.types.liability].map((item) => item.fireflyCode)
      list = list.filter((item) => allowedTypes.includes(item?.attributes?.type) && Account.getIsActive(item))
      this.accountList = AccountTransformer.transformFromApiList(list)
      this.isLoadingAccounts = false

      if (!dashboardCurrency?.id) {
        let currencies = list.map((item) => item?.attributes?.currency).filter((item) => !!item)
        return head(currencies)
      }
      return null
    },
  },
})
