import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy, head } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import DateUtils from '~/utils/DateUtils.js'
import { startOfTomorrow } from 'date-fns/startOfTomorrow'

export const useAccountStore = defineStore('account', () => {
  const accountList = useLocalStorage('accountList', [])
  const isLoadingAccounts = ref(false)

  const accountDictionary = computed(() => {
    return keyBy(accountList.value, 'id')
  })

  async function fetchAccounts(dashboardCurrency) {
    isLoadingAccounts.value = true
    let filters = [{ field: 'date', value: DateUtils.dateToString(startOfTomorrow()) }]
    let list = await new AccountRepository().getAllWithMerge({ filters })
    const allowedTypes = [Account.types.asset, Account.types.expense, Account.types.revenue, Account.types.liability].map((item) => item.fireflyCode)
    list = list.filter((item) => allowedTypes.includes(item?.attributes?.type) && Account.getIsActive(item))
    accountList.value = AccountTransformer.transformFromApiList(list)
    isLoadingAccounts.value = false

    if (!dashboardCurrency?.id) {
      let currencies = list.map((item) => item?.attributes?.currency).filter((item) => !!item)
      return head(currencies)
    }
    return null
  }

  return {
    accountList,
    isLoadingAccounts,
    accountDictionary,
    fetchAccounts,
  }
})
