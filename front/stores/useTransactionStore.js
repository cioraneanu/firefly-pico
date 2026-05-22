import { defineStore } from 'pinia'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import DateUtils from '~/utils/DateUtils.js'
import { startOfDay, subDays } from 'date-fns'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils.js'
import Tag from '~/models/Tag.js'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    isLoadingDashboardTransactions: false,
    isLoadingDashboardTransactionsLastWeek: false,
  }),

  actions: {
    async fetchTransactionsWithTodos(tagTodo) {
      if (!tagTodo) return []

      let filters = [
        {
          field: 'query',
          value: `tag_is:"${Tag.getDisplayNameEllipsized(tagTodo)}"`,
        },
      ]
      let list = await new TransactionRepository().searchTransaction({ filters })
      return TransactionTransformer.transformFromApiList(list?.data ?? [])
    },

    async fetchDashboardTransactionsForInterval(startDate, endDate, backendFilters) {
      this.isLoadingDashboardTransactions = true

      let filtersParts = [`date_after:${DateUtils.dateToString(startDate)}`, `date_before:${DateUtils.dateToString(endDate)}`, ...getExcludedTransactionFilters()]
      filtersParts = [...filtersParts, ...backendFilters]
      let filters = [{ field: 'query', value: filtersParts.join(' ') }]
      let searchMethod = new TransactionRepository().searchTransaction
      let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

      this.isLoadingDashboardTransactions = false
      return TransactionTransformer.transformFromApiList(list)
    },

    async fetchDashboardTransactionsForWeek(backendFilters) {
      this.isLoadingDashboardTransactionsLastWeek = true

      let startDate = DateUtils.dateToString(subDays(startOfDay(new Date()), 7))
      let endDate = DateUtils.dateToString(startOfDay(new Date()))

      let filtersParts = [`date_after:${startDate}`, `date_before:${endDate}`, `type:withdrawal`, ...getExcludedTransactionFilters()]
      filtersParts = [...filtersParts, ...backendFilters]
      let filters = [{ field: 'query', value: filtersParts.join(' ') }]
      let searchMethod = new TransactionRepository().searchTransaction
      let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

      this.isLoadingDashboardTransactionsLastWeek = false
      return TransactionTransformer.transformFromApiList(list)
    },
  },
})
