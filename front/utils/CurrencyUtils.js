import Transaction from '~/models/Transaction'
import { useCurrencyStore } from '~/stores/currencyStore'

export function convertCurrency(amount, fromCurrency, toCurrency) {
  const currencyStore = useCurrencyStore()

  if (fromCurrency === toCurrency) {
    return amount
  }

  // 1) Respect an exact user-defined rate for this pair (rate = "how many `to` for 1 `from`").
  const userRates = currencyStore.userExchangeRatesDictionary
  const directRate = userRates[`${fromCurrency}_${toCurrency}`]
  if (Number.isFinite(directRate) && directRate !== 0) {
    return amount * directRate
  }
  const inverseRate = userRates[`${toCurrency}_${fromCurrency}`]
  if (Number.isFinite(inverseRate) && inverseRate !== 0) {
    return amount / inverseRate
  }

  // 2) Fall back to USD-anchored triangulation (augmented with user-defined currencies).
  const rates = currencyStore.effectiveExchangeRates
  const exchangeSource = rates[fromCurrency]
  const exchangeDestination = rates[toCurrency]
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
