import assert from 'node:assert/strict'
import test from 'node:test'
import { formatAmount, normalizeAmount } from '../utils/AmountUtils.js'

for (const [locale, group, decimal] of [
  ['de-DE', '.', ','],
  ['en-EN', ',', '.'],
]) {
  test(`${locale} formats continuous input`, () => {
    assert.equal(formatAmount('1111', locale), `1${group}111`)
    assert.equal(formatAmount(normalizeAmount(`1${group}1111`, locale), locale), `11${group}111`)
  })

  test(`${locale} normalizes formatted expressions`, () => {
    assert.equal(normalizeAmount(`1${group}234${decimal}5*2`, locale), '1234.5*2')
  })

  test(`${locale} preserves incomplete decimals`, () => {
    assert.equal(formatAmount('1234.', locale), `1${group}234${decimal}`)
  })
}

test('de-DE accepts a dot as an unambiguous decimal separator', () => {
  assert.equal(normalizeAmount('1234.5', 'de-DE'), '1234.5')
})

test('expressions and negative values remain canonical', () => {
  assert.equal(formatAmount('1234*2', 'de-DE'), '1234*2')
  assert.equal(formatAmount('-1234.5', 'en-EN'), '-1,234.5')
  assert.equal(formatAmount(1234.5, 'en-EN'), '1,234.5')
})
