import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy, head } from 'lodash-es'
import { useIdbStorage } from '~/utils/IdbStorage.js'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import DateUtils from '~/utils/DateUtils.js'
import { startOfTomorrow } from 'date-fns/startOfTomorrow'

export const useAccountStore = defineStore('account', () => {
  const accountList = useIdbStorage('accountList', [])
  const isLoadingAccounts = ref(false)

  const accountDictionary = computed(() => {
    return keyBy(accountList.value, 'id')
  })

  function applyAccountList(list) {
    const allowedTypes = [Account.types.asset, Account.types.expense, Account.types.revenue, Account.types.liability].map((item) => item.fireflyCode)
    list = list.filter((item) => allowedTypes.includes(item?.attributes?.type) && Account.getIsActive(item))
    accountList.value = AccountTransformer.transformFromApiList(list)
  }

  async function fetchAccounts() {
    isLoadingAccounts.value = true
    let filters = [{ field: 'date', value: DateUtils.dateToString(startOfTomorrow()) }]
    let list = await new AccountRepository().getAllWithMerge({ filters })
    applyAccountList(list)
    isLoadingAccounts.value = false
  }

  return {
    accountList,
    isLoadingAccounts,
    accountDictionary,
    applyAccountList,
    fetchAccounts,
  }
})
