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
    expect(fact.schemaVersion).toBe(2)
    expect(fact.monthKey).toBe('2026-08')
    expect(fact.rangeStart).toBe('2026-08-01')
    expect(fact.rangeEnd).toBe('2026-08-31')
  })
})

describe('buildMonthlyFact — analyticsFilters re-checks each split, not just the group', () => {
  // Firefly's budget_is/category_is/etc. match at the GROUP level: once any one split in a group
  // matches, the API returns the WHOLE group, every split — including one under a totally
  // different budget/merchant on the same multi-line purchase. Without the analyticsFilters
  // re-check, that sibling split leaks into byMerchant/byBudget/etc. even though the user only
  // asked to see one budget's data.
  const groupBothMatching = expenseTransaction({ amount: 20, budgetId: GOING_OUT_BUDGET_ID, destinationId: CAFE_CENTRAL_ID })

  // A single Firefly-returned GROUP whose two splits carry DIFFERENT budgets/merchants — the
  // real shape Firefly sends back when only one split matched the server-side query.
  const mixedGroup = {
    attributes: {
      transactions: [
        {
          type: { code: 'expense' },
          amount: '20.00',
          currency_code: 'EUR',
          category_id: 'cat-dining',
          budget_id: GOING_OUT_BUDGET_ID,
          tags: [],
          destination_id: CAFE_CENTRAL_ID,
          date: new Date(2026, 7, 10),
        },
        { type: { code: 'expense' }, amount: '15.00', currency_code: 'EUR', category_id: 'cat-housing', budget_id: 'b-rent', tags: [], destination_id: 'm-landlord', date: new Date(2026, 7, 10) },
      ],
    },
  }

  const filterState = { budget: { selected: [{ id: GOING_OUT_BUDGET_ID }], mode: 'include' } }

  it("without a filter, both splits are attributed (today's baseline behaviour)", () => {
    const fact = buildMonthlyFact([mixedGroup], { monthKey: '2026-08', rangeStart: AUGUST_START, rangeEnd: AUGUST_END })
    expect(fact.byBudget[GOING_OUT_BUDGET_ID].EUR).toBeCloseTo(20, 2)
    expect(fact.byBudget['b-rent'].EUR).toBeCloseTo(15, 2)
    expect(fact.byMerchant['m-landlord']).toBeDefined()
  })

  it('with the budget filter active, only the matching split is attributed — the sibling does not leak in', () => {
    const fact = buildMonthlyFact([mixedGroup], { monthKey: '2026-08', rangeStart: AUGUST_START, rangeEnd: AUGUST_END, analyticsFilters: filterState })
    expect(fact.byBudget[GOING_OUT_BUDGET_ID].EUR).toBeCloseTo(20, 2)
    expect(fact.byBudget['b-rent']).toBeUndefined()
    expect(fact.byMerchant['m-landlord']).toBeUndefined()
    expect(fact.byMerchant[CAFE_CENTRAL_ID].amount.EUR).toBeCloseTo(20, 2)
  })

  it('totals.expense still counts the WHOLE group, unattributed, matching the accepted totals design', () => {
    const fact = buildMonthlyFact([mixedGroup], { monthKey: '2026-08', rangeStart: AUGUST_START, rangeEnd: AUGUST_END, analyticsFilters: filterState })
    expect(fact.totals.expense.EUR).toBeCloseTo(35, 2) // 20 + 15, both splits — not just the matching one
  })

  it('a fully-matching group is unaffected by the filter', () => {
    const fact = buildMonthlyFact([groupBothMatching], { monthKey: '2026-08', rangeStart: AUGUST_START, rangeEnd: AUGUST_END, analyticsFilters: filterState })
    expect(fact.byBudget[GOING_OUT_BUDGET_ID].EUR).toBeCloseTo(20, 2)
  })
})
