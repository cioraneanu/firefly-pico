import { get } from 'lodash'
import Transaction from '~/models/Transaction'

export function convertAmount(amount, fromCurrency, toCurrency, exchangeRates) {
  const exchangeSource = get(exchangeRates, `rates.${fromCurrency}`)
  const exchangeDestination = get(exchangeRates, `rates.${toCurrency}`)
  return (1.0 * amount * exchangeDestination) / exchangeSource
}

export function transactionAmountInAccountCurrency (transaction, accountCurrency, exchangeRates) {
  const amount = Transaction.getAmount(transaction)
  const currency = Transaction.getCurrency(transaction)

  return convertAmount(
    amount,
    currency,
    accountCurrency,
    exchangeRates,
  )
}

export function transactionsTotalInAccountCurrency (transactions, accountCurrency, exchangeRates) {
  return transactions.reduce((total, transaction) => {
    return total + transactionAmountInAccountCurrency(transaction, accountCurrency, exchangeRates)
  }, 0);
}