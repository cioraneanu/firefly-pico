import { describe, expect, it } from 'vitest'
import {
  sumAmountMap,
  mergeAmountMaps,
  factFilterHash,
  assignColorSlots,
  rankTopNWithOther,
  rankTopNByMagnitudeWithOther,
  leastSquaresSlope,
  movingAverage,
  median,
  budgetSeverity,
} from '~/utils/AnalyticsUtils'

describe('sumAmountMap', () => {
  it('sums entries by currency code', () => {
    const result = sumAmountMap([
      { amount: 10, currencyCode: 'EUR' },
      { amount: 5, currencyCode: 'EUR' },
      { amount: 20, currencyCode: 'USD' },
    ])
    expect(result).toEqual({ EUR: 15, USD: 20 })
  })

  it('skips zero/falsy amounts so they do not pollute the map with a stray currency key', () => {
    expect(sumAmountMap([{ amount: 0, currencyCode: 'EUR' }])).toEqual({})
  })

  it('returns {} for empty/undefined input', () => {
    expect(sumAmountMap([])).toEqual({})
    expect(sumAmountMap(undefined)).toEqual({})
  })
})

describe('mergeAmountMaps', () => {
  it('unions maps, summing matching currency keys', () => {
    const result = mergeAmountMaps({ EUR: 10, USD: 5 }, { EUR: 2 }, {})
    expect(result).toEqual({ EUR: 12, USD: 5 })
  })

  it('tolerates undefined maps in the argument list', () => {
    expect(mergeAmountMaps(undefined, { EUR: 3 }, undefined)).toEqual({ EUR: 3 })
  })
})

describe('factFilterHash', () => {
  it('is independent of excluded-id array ordering', () => {
    const a = factFilterHash({ firstDayOfMonth: 1, excludedAccountIds: [2, 1], excludedCategoryIds: [], excludedTagIds: [], tagsWidgetModeOnlyRootTag: true })
    const b = factFilterHash({ firstDayOfMonth: 1, excludedAccountIds: [1, 2], excludedCategoryIds: [], excludedTagIds: [], tagsWidgetModeOnlyRootTag: true })
    expect(a).toBe(b)
  })

  it('changes when a value that affects fetch results changes', () => {
    const a = factFilterHash({ firstDayOfMonth: 1, tagsWidgetModeOnlyRootTag: true })
    const b = factFilterHash({ firstDayOfMonth: 27, tagsWidgetModeOnlyRootTag: true })
    expect(a).not.toBe(b)
  })

  it("is independent of the analytics dimensional filter's selected-id ordering", () => {
    const category = (id) => ({ id, attributes: { name: `Cat ${id}` } })
    const a = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [category(2), category(1)], mode: 'include' } } })
    const b = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [category(1), category(2)], mode: 'include' } } })
    expect(a).toBe(b)
  })

  it('changes when the analytics dimensional filter mode flips (include vs exclude), even with the same selection', () => {
    const category = (id) => ({ id, attributes: { name: `Cat ${id}` } })
    const a = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [category(1)], mode: 'include' } } })
    const b = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [category(1)], mode: 'exclude' } } })
    expect(a).not.toBe(b)
  })

  it('changes when the analytics dimensional filter selection changes', () => {
    const category = (id) => ({ id, attributes: { name: `Cat ${id}` } })
    const a = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [], mode: 'include' } } })
    const b = factFilterHash({ firstDayOfMonth: 1, analyticsFilters: { category: { selected: [category(1)], mode: 'include' } } })
    expect(a).not.toBe(b)
  })
})

describe('assignColorSlots', () => {
  it('assigns sequential slots up to the cap, folding the rest to "other"', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const result = assignColorSlots(ids, 8)
    expect(result.a).toBe(0)
    expect(result.h).toBe(7)
    expect(result.i).toBe('other')
    expect(result.j).toBe('other')
  })
})

describe('rankTopNWithOther', () => {
  it('splits into top N (descending) and an other bucket with the remainder summed', () => {
    const totals = { a: 10, b: 50, c: 30, d: 5, e: 20 }
    const result = rankTopNWithOther(totals, 3)
    expect(result.topIds).toEqual(['b', 'c', 'e'])
    expect(result.otherIds).toEqual(['a', 'd'])
    expect(result.otherTotal).toBe(15)
  })

  it('breaks ties deterministically by id string', () => {
    const result = rankTopNWithOther({ z: 10, a: 10 }, 1)
    expect(result.topIds).toEqual(['a'])
    expect(result.otherIds).toEqual(['z'])
  })

  it('returns an empty other bucket when n covers every id', () => {
    const result = rankTopNWithOther({ a: 1, b: 2 }, 5)
    expect(result.topIds).toEqual(['b', 'a'])
    expect(result.otherIds).toEqual([])
    expect(result.otherTotal).toBe(0)
  })

  it('tolerates an empty/undefined totals map', () => {
    expect(rankTopNWithOther({}, 5)).toEqual({ topIds: [], otherIds: [], otherTotal: 0 })
    expect(rankTopNWithOther(undefined, 5)).toEqual({ topIds: [], otherIds: [], otherTotal: 0 })
  })
})

describe('rankTopNByMagnitudeWithOther', () => {
  it('ranks by absolute magnitude, not raw value, so a big decrease outranks a small increase', () => {
    const deltas = { a: -50, b: 10, c: 30, d: -5, e: 20 }
    const result = rankTopNByMagnitudeWithOther(deltas, 3)
    expect(result.topIds).toEqual(['a', 'c', 'e'])
    expect(result.otherIds).toEqual(['b', 'd'])
    expect(result.otherValue).toBe(5) // 10 + -5, signed sum not magnitude sum
  })

  it('breaks ties deterministically by id string', () => {
    const result = rankTopNByMagnitudeWithOther({ z: -10, a: 10 }, 1)
    expect(result.topIds).toEqual(['a'])
    expect(result.otherIds).toEqual(['z'])
  })

  it('returns an empty other bucket when n covers every id', () => {
    const result = rankTopNByMagnitudeWithOther({ a: -1, b: 2 }, 5)
    expect(result.topIds).toEqual(['b', 'a'])
    expect(result.otherIds).toEqual([])
    expect(result.otherValue).toBe(0)
  })

  it('tolerates an empty/undefined values map', () => {
    expect(rankTopNByMagnitudeWithOther({}, 5)).toEqual({ topIds: [], otherIds: [], otherValue: 0 })
    expect(rankTopNByMagnitudeWithOther(undefined, 5)).toEqual({ topIds: [], otherIds: [], otherValue: 0 })
  })
})

describe('leastSquaresSlope', () => {
  it('regresses against the true month index, not the observed-position index', () => {
    // Months 0, 1, 5 (a gap) with values 0, 10, 50 — a perfect line of slope 10 over the
    // TRUE index. Regressing over observed position (0,1,2) would overstate the slope.
    const { slope, intercept } = leastSquaresSlope([0, 1, 5], [0, 10, 50])
    expect(slope).toBeCloseTo(10, 5)
    expect(intercept).toBeCloseTo(0, 5)
  })

  it('returns null for fewer than 2 points', () => {
    expect(leastSquaresSlope([1], [1])).toBeNull()
    expect(leastSquaresSlope([], [])).toBeNull()
  })

  it('returns null when x has zero variance', () => {
    expect(leastSquaresSlope([3, 3, 3], [1, 2, 3])).toBeNull()
  })
})

describe('movingAverage', () => {
  it('computes a trailing-window mean of the same length as the input', () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5])
  })
})

describe('median', () => {
  it('handles odd and even length arrays without mutating the input', () => {
    const odd = [5, 1, 3]
    expect(median(odd)).toBe(3)
    expect(odd).toEqual([5, 1, 3])

    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('returns null for an empty array', () => {
    expect(median([])).toBeNull()
  })
})

describe('budgetSeverity', () => {
  it('buckets at the 50/70/90 boundaries', () => {
    expect(budgetSeverity(0)).toBe('good')
    expect(budgetSeverity(49)).toBe('good')
    expect(budgetSeverity(50)).toBe('warning')
    expect(budgetSeverity(69)).toBe('warning')
    expect(budgetSeverity(70)).toBe('serious')
    expect(budgetSeverity(89)).toBe('serious')
    expect(budgetSeverity(90)).toBe('critical')
    expect(budgetSeverity(150)).toBe('critical')
  })

  it('passes through null/undefined as null (no limit defined yet)', () => {
    expect(budgetSeverity(null)).toBeNull()
    expect(budgetSeverity(undefined)).toBeNull()
  })
})
