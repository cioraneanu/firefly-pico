import { formatTimeAgo } from '@vueuse/core'
import { capitalize, groupBy } from 'lodash-es'
import Transaction from '~/core/models/Transaction'
import { formatNumber } from '~/core/utils/NumberUtils'

// Transactions grouped by day, each day with its relative date and its expenses total (Transactions page, TODO Inbox)
export function useTransactionGroups(list) {
  return computed(() =>
    Object.entries(groupBy(toValue(list), (transaction) => DateUtils.dateToUI(Transaction.getDate(transaction)))).map(([label, items]) => {
      const expenses = items.filter((transaction) => Transaction.getTypeCode(transaction) === Transaction.types.expense.code)
      const total = expenses.reduce((sum, transaction) => sum + parseFloat(Transaction.getAmount(transaction) || 0), 0)
      return {
        label,
        items,
        relative: capitalize(formatTimeAgo(DateUtils.autoToDate(Transaction.getDate(items[0])))),
        total: total ? `−${formatNumber(total, 2)} ${Transaction.getFirstSplit(items[0])?.currency_symbol ?? ''}` : '',
      }
    }),
  )
}
