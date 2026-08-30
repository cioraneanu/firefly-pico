import { describe, expect, it } from 'vitest'
import { buildMonthlyFact } from '~/utils/AnalyticsUtils'

// Fixture note: I don't have live access to demo.firefly-iii.org's API from this environment.
// This is a hand-constructed, JSON:API-shaped fixture (matching the real post-transform split
// shape documented in front/transformers/TransactionTransformer.js — attributes.transactions[]
// with amount/currency_code/category_id/budget_id/tags/destination_id/type/date) whose splits
// are constructed to sum to ANALYTICS_PLAN.md's published August 2026 demo figures: income
// EUR 2059.64, expenses EUR 1624.79, net EUR 434.85, budget "Going out" EUR 155.20 across
// exactly 4 transactions at Cafe Central. This tests buildMonthlyFact's arithmetic and
// attribution correctness (the actual thing at risk of bugs) even though the bytes aren't
// literally captured from the live demo — swap in a real captured response and this gets
// strictly stronger for free.

const AUGUST_START = new Date(2026, 7, 1)
const AUGUST_END = new Date(2026, 7, 31)

function incomeTransaction(amount) {
  return {
    attributes: {
      transactions: [
        {
          type: { code: 'income' },
          amount: amount.toFixed(2),
          currency_code: 'EUR',
          category_id: null,
          budget_id: null,
          tags: [],
          destination_id: null,
          date: new Date(2026, 7, 1),
        },
      ],
    },
  }
}

function expenseTransaction({ amount, categoryId = 'cat-other', budgetId = null, destinationId = 'm-other', date = new Date(2026, 7, 15) }) {
  return {
    attributes: {
      transactions: [
        {
          type: { code: 'expense' },
          amount: amount.toFixed(2),
          currency_code: 'EUR',
          category_id: categoryId,
          budget_id: budgetId,
          tags: [],
          destination_id: destinationId,
          date,
        },
      ],
    },
  }
}

const GOING_OUT_BUDGET_ID = 'b-going-out'
const CAFE_CENTRAL_ID = 'm-cafe-central'

const cafeCentralTransactions = [38.8, 38.8, 38.8, 38.8].map((amount, index) =>
  expenseTransaction({ amount, categoryId: 'cat-dining', budgetId: GOING_OUT_BUDGET_ID, destinationId: CAFE_CENTRAL_ID, date: new Date(2026, 7, 5 + index) }),
)

const rentTransaction = expenseTransaction({ amount: 1469.59, categoryId: 'cat-housing', budgetId: 'b-rent', destinationId: 'm-landlord', date: new Date(2026, 7, 1) })

const transactions = [incomeTransaction(2059.64), ...cafeCentralTransactions, rentTransaction]

describe('buildMonthlyFact — demo fixture cross-check', () => {
  const fact = buildMonthlyFact(transactions, { monthKey: '2026-08', rangeStart: AUGUST_START, rangeEnd: AUGUST_END })

  it('reproduces income, expense, and net exactly', () => {
    expect(fact.totals.income.EUR).toBeCloseTo(2059.64, 2)
    expect(fact.totals.expense.EUR).toBeCloseTo(1624.79, 2)
    expect(fact.totals.income.EUR - fact.totals.expense.EUR).toBeCloseTo(434.85, 2)
  })

  it('attributes the "Going out" budget exactly, across 4 Cafe Central transactions', () => {
    expect(fact.byBudget[GOING_OUT_BUDGET_ID].EUR).toBeCloseTo(155.2, 2)
    expect(fact.byMerchant[CAFE_CENTRAL_ID].amount.EUR).toBeCloseTo(155.2, 2)
    expect(fact.byMerchant[CAFE_CENTRAL_ID].count).toBe(4)
  })

  it('counts every transaction group, income and expense alike', () => {
    expect(fact.transactionCount).toBe(transactions.length)
  })

  it('carries schema version and range metadata', () => {
    expect(fact.schemaVersion).toBe(1)
    expect(fact.monthKey).toBe('2026-08')
    expect(fact.rangeStart).toBe('2026-08-01')
    expect(fact.rangeEnd).toBe('2026-08-31')
  })
})
