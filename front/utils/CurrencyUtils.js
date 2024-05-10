import { get } from 'lodash'
import Transaction from '~/models/Transaction'

export function convertCurrency(amount, fromCurrency, toCurrency) {
  const dataStore = useDataStore()

  const exchangeSource = get(dataStore.exchangeRates, `rates.${fromCurrency}`)
  const exchangeDestination = get(dataStore.exchangeRates, `rates.${toCurrency}`)
  return (1.0 * amount * exchangeDestination) / exchangeSource
}

export function convertTransactionAmountToCurrency(transaction, accountCurrency) {
  const amount = Transaction.getAmount(transaction)
  const currency = Transaction.getCurrency(transaction)

  return convertCurrency(amount, currency, accountCurrency)
}

export function convertTransactionsTotalAmountToCurrency(transactions, accountCurrency) {
  return transactions.reduce((total, transaction) => {
    return total + convertTransactionAmountToCurrency(transaction, accountCurrency)
  }, 0)
}
