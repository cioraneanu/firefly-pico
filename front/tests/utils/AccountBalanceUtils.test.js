import assert from 'node:assert/strict'
import test from 'node:test'
import { getBalanceWithoutVirtual, hasVirtualBalance } from '../../utils/AccountBalanceUtils.js'

test('derives the booked balance for secured credit card collateral', () => {
  assert.equal(getBalanceWithoutVirtual('-100', '-500'), 400)
})

test('derives the booked balance when virtual balance represents a credit limit', () => {
  assert.equal(getBalanceWithoutVirtual('39000', '40000'), -1000)
})

test('preserves decimal account balances', () => {
  assert.equal(getBalanceWithoutVirtual('290.99', '500'), -209.01)
})

test('uses current balance when no virtual balance is set', () => {
  assert.equal(getBalanceWithoutVirtual('125.50', '0'), 125.5)
  assert.equal(getBalanceWithoutVirtual('125.50', null), 125.5)
  assert.equal(getBalanceWithoutVirtual('125.50'), 125.5)
})

test('preserves a missing or invalid current balance', () => {
  assert.equal(getBalanceWithoutVirtual(null, '-500'), null)
  assert.equal(getBalanceWithoutVirtual(undefined, '-500'), undefined)
  assert.equal(getBalanceWithoutVirtual('unknown', '-500'), 'unknown')
})

test('shows Available only for a non-zero numeric virtual balance', () => {
  assert.equal(hasVirtualBalance('-500'), true)
  assert.equal(hasVirtualBalance('40000'), true)
  assert.equal(hasVirtualBalance('0'), false)
  assert.equal(hasVirtualBalance('0.00'), false)
  assert.equal(hasVirtualBalance(''), false)
  assert.equal(hasVirtualBalance(null), false)
  assert.equal(hasVirtualBalance(undefined), false)
  assert.equal(hasVirtualBalance('unknown'), false)
})
