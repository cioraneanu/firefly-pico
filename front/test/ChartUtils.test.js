import { describe, expect, it } from 'vitest'
import { seriesColor, stackSeries } from '~/utils/ChartUtils'

// resolveCssVar() is not unit-tested here — it needs `document`/`getComputedStyle`, which this
// project's vitest config deliberately runs without (`environment: 'node'`, no jsdom installed),
// matching the rest of ChartUtils/AnalyticsUtils's "no DOM" testability convention. It's a
// one-line passthrough to getComputedStyle(); verify it via the manual dark-mode toggle check
// (ANALYTICS_PLAN.md Part 6) instead.

describe('seriesColor', () => {
  it('maps slot 0..7 to --viz-categorical-1..8', () => {
    expect(seriesColor(0)).toBe('--viz-categorical-1')
    expect(seriesColor(7)).toBe('--viz-categorical-8')
  })

  it('maps "other" and out-of-range slots to --viz-other', () => {
    expect(seriesColor('other')).toBe('--viz-other')
    expect(seriesColor(8)).toBe('--viz-other')
    expect(seriesColor(null)).toBe('--viz-other')
  })
})

describe('stackSeries', () => {
  it('produces cumulative from/to bands per row, bottom-to-top in seriesIds order', () => {
    const rows = [
      { key: '2026-01', isLoaded: true, values: { a: 10, b: 20, other: 5 } },
      { key: '2026-02', isLoaded: true, values: { a: 0, b: 15, other: 0 } },
    ]
    const result = stackSeries(rows, ['a', 'b', 'other'])
    expect(result[0].bands).toEqual({ a: { from: 0, to: 10 }, b: { from: 10, to: 30 }, other: { from: 30, to: 35 } })
    expect(result[0].total).toBe(35)
    expect(result[1].bands).toEqual({ a: { from: 0, to: 0 }, b: { from: 0, to: 15 }, other: { from: 15, to: 15 } })
  })

  it('defaults a missing id in a row to 0 rather than throwing', () => {
    const rows = [{ key: '2026-01', isLoaded: true, values: { a: 10 } }]
    const result = stackSeries(rows, ['a', 'b'])
    expect(result[0].bands.b).toEqual({ from: 10, to: 10 })
  })

  it('preserves row key/isLoaded pass-through', () => {
    const rows = [{ key: '2026-01', isLoaded: false, values: {} }]
    const result = stackSeries(rows, ['a'])
    expect(result[0].key).toBe('2026-01')
    expect(result[0].isLoaded).toBe(false)
  })
})
