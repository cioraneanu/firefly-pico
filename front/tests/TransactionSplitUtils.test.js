import assert from 'node:assert/strict'
import test from 'node:test'
import { formatAmountToCurrencyPrecision } from '../utils/AmountUtils.js'
import { getTransactionSplitTotals } from '../utils/TransactionSplitUtils.js'

const transactionWith = (transactions) => ({ attributes: { transactions } })

test('adds split amounts exactly at the declared currency precision', () => {
  const totals = getTransactionSplitTotals(
    transactionWith([
      { amount: '59.40', currency_id: '1', currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 },
      { amount: '2321.00', currency_id: '1', currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 },
    ]),
  )

  assert.deepEqual(totals, [{ amount: '2380.40', currencyId: '1', currencyCode: 'USD', currencySymbol: '$', decimalPlaces: 2 }])
})

test('does not introduce floating point artifacts', () => {
  const totals = getTransactionSplitTotals(
    transactionWith([
      { amount: '0.10', currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 },
      { amount: '0.20', currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 },
    ]),
  )

  assert.equal(totals[0].amount, '0.30')
})

test('uses transformed currency metadata when raw Firefly fields are unavailable', () => {
  const totals = getTransactionSplitTotals(
    transactionWith([
      { amount: '3.50', currency: { id: '1', attributes: { code: 'USD', symbol: '$', decimal_places: 2 } } },
      { amount: '1.25', currency: { id: '1', attributes: { code: 'USD', symbol: '$', decimal_places: 2 } } },
    ]),
  )

  assert.deepEqual(totals, [{ amount: '4.75', currencyId: '1', currencyCode: 'USD', currencySymbol: '$', decimalPlaces: 2 }])
})

test('keeps decimal strings exact across currency display formatting and aggregation', () => {
  const transformedAmounts = ['9999999999999999.990000000000', '0.010000000000'].map((amount) => formatAmountToCurrencyPrecision(amount, 2))
  const totals = getTransactionSplitTotals(transactionWith(transformedAmounts.map((amount) => ({ amount, currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 }))))

  assert.deepEqual(transformedAmounts, ['9999999999999999.99', '0.01'])
  assert.equal(totals[0].amount, '10000000000000000.00')
  assert.equal(formatAmountToCurrencyPrecision('4.025000000000', 2), '4.025')
})

test('keeps unlike currencies separate in first-seen order', () => {
  const totals = getTransactionSplitTotals(
    transactionWith([
      { amount: '10.00', currency_id: '2', currency_code: 'EUR', currency_symbol: '€', currency_decimal_places: 2 },
      { amount: '4.25', currency_id: '1', currency_code: 'USD', currency_symbol: '$', currency_decimal_places: 2 },
      { amount: '2.50', currency_id: '2', currency_code: 'EUR', currency_symbol: '€', currency_decimal_places: 2 },
    ]),
  )

  assert.deepEqual(totals, [
    { amount: '12.50', currencyId: '2', currencyCode: 'EUR', currencySymbol: '€', decimalPlaces: 2 },
    { amount: '4.25', currencyId: '1', currencyCode: 'USD', currencySymbol: '$', decimalPlaces: 2 },
  ])
})

test('supports signed amounts and excludes malformed values from totals', () => {
  const totals = getTransactionSplitTotals(
    transactionWith([
      { amount: '5.125', currency_code: 'USD', currency_decimal_places: 2 },
      { amount: '-1.100', currency_code: 'USD', currency_decimal_places: 2 },
      { amount: 'not-an-amount', currency_code: 'USD', currency_decimal_places: 2 },
    ]),
  )

  assert.deepEqual(totals, [{ amount: '4.025', currencyId: null, currencyCode: 'USD', currencySymbol: null, decimalPlaces: 3 }])
})

test('returns no totals when the transaction has no valid split amounts', () => {
  assert.deepEqual(getTransactionSplitTotals(transactionWith([])), [])
  assert.deepEqual(getTransactionSplitTotals(transactionWith([{ amount: null, currency_code: 'USD' }])), [])
})
