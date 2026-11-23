import { formatTimeAgo } from '@vueuse/core'
import { capitalize, groupBy, sumBy } from 'lodash-es'
import { format } from 'date-fns'
import Transaction from '~/core/models/Transaction'
import { formatNumber } from '~/core/utils/NumberUtils'
import { useProfileStore } from '~/core/stores/profileStore'

// Transactions grouped by day, each day with its weekday, relative date and net total (income − expenses) per currency (Transactions page, TODO Inbox).
// With day groups turned off (profileStore.transactionListGroupByDay) it is one group without a header (label null).
export function useTransactionGroups(list) {
  const profileStore = useProfileStore()

  return computed(() => {
    if (!profileStore.transactionListGroupByDay) {
      return [{ label: null, items: toValue(list) }]
    }
    return Object.entries(groupBy(toValue(list), (transaction) => DateUtils.dateToUI(Transaction.getDate(transaction)))).map(([label, items]) => {
      const date = DateUtils.autoToDate(Transaction.getDate(items[0]))
      // Income counts +, expenses −, transfers are left out
      const splitTotals = items.flatMap((transaction) => {
        const sign = { [Transaction.types.income.code]: 1, [Transaction.types.expense.code]: -1 }[Transaction.getTypeCode(transaction)]
        return sign ? Transaction.getSplitTotals(transaction).map((total) => ({ ...total, amount: sign * parseFloat(total.amount) })) : []
      })
      const totals = Object.values(groupBy(splitTotals, 'currencyCode')).map((parts) => {
        const net = Number(sumBy(parts, 'amount').toFixed(parts[0].decimalPlaces))
        const amount = formatNumber(Math.abs(net), parts[0].decimalPlaces)
        const sign = net > 0 ? '+' : net < 0 ? '−' : ''
        return `${sign}${amount} ${parts[0].currencySymbol ?? ''}`.trim()
      })
      return {
        label,
        items,
        dayOfWeek: date ? capitalize(format(date, 'EEE')) : '',
        relative: capitalize(formatTimeAgo(date)),
        total: totals.join(' · '),
      }
    })
  })
}
