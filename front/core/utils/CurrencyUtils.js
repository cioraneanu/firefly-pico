import Transaction from '~/core/models/Transaction'
import { useCurrencyStore } from '~/core/stores/currencyStore'

export function convertCurrency(amount, fromCurrency, toCurrency) {
  const currencyStore = useCurrencyStore()

  const exchangeSource = currencyStore.rates[fromCurrency]
  const exchangeDestination = currencyStore.rates[toCurrency]
  return (1.0 * amount * exchangeDestination) / exchangeSource
}

export function convertTransactionAmountToCurrency(transaction, accountCurrency) {
  const amount = Transaction.getAmount(transaction)
  const currency = Transaction.getCurrencyCode(transaction)
  return convertCurrency(amount, currency, accountCurrency)
}

export function convertTransactionsTotalAmountToCurrency(transactions, accountCurrency) {
  return transactions.reduce((total, transaction) => {
    return total + convertTransactionAmountToCurrency(transaction, accountCurrency)
  }, 0)
}
