import { formatTimeAgo } from '@vueuse/core'
import { capitalize, groupBy } from 'lodash-es'
import { format } from 'date-fns'
import Transaction from '~/core/models/Transaction'
import { formatNumber } from '~/core/utils/NumberUtils'
import { useProfileStore } from '~/core/stores/profileStore'

// Transactions grouped by day, each day with its weekday, relative date and expenses total (Transactions page, TODO Inbox).
// With day groups turned off (profileStore.transactionListGroupByDay) it is one group without a header (label null).
export function useTransactionGroups(list) {
  const profileStore = useProfileStore()

  return computed(() => {
    if (!profileStore.transactionListGroupByDay) {
      return [{ label: null, items: toValue(list) }]
    }
    return Object.entries(groupBy(toValue(list), (transaction) => DateUtils.dateToUI(Transaction.getDate(transaction)))).map(([label, items]) => {
      const date = DateUtils.autoToDate(Transaction.getDate(items[0]))
      const expenses = items.filter((transaction) => Transaction.getTypeCode(transaction) === Transaction.types.expense.code)
      const total = expenses.reduce((sum, transaction) => sum + parseFloat(Transaction.getAmount(transaction) || 0), 0)
      return {
        label,
        items,
        dayOfWeek: date ? capitalize(format(date, 'EEE')) : '',
        relative: capitalize(formatTimeAgo(date)),
        total: total ? `−${formatNumber(total, 2)} ${Transaction.getFirstSplit(items[0])?.currency_symbol ?? ''}` : '',
      }
    })
  })
}
