import { describe, expect, it } from 'vitest'
import { seriesColor, stackSeries, withAlpha, sequentialBucket } from '~/utils/ChartUtils'

// resolveCssVar() and drawHorizontalRule() are not unit-tested here — they need
// `document`/`getComputedStyle` and a real uPlot/canvas instance respectively, neither of which
// this project's vitest config supports (`environment: 'node'`, no jsdom installed), matching the
// rest of ChartUtils/AnalyticsUtils's "no DOM" testability convention. Verify both via the manual
// dark-mode toggle check (ANALYTICS_PLAN.md Part 6) instead.

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

describe('withAlpha', () => {
  it('converts a resolved hex color to an rgba string at the given alpha', () => {
    expect(withAlpha('#008300', 0.1)).toBe('rgba(0, 131, 0, 0.1)')
    expect(withAlpha('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)')
  })
})

describe('sequentialBucket', () => {
  it('maps a value to a 1-indexed bucket proportional to max', () => {
    expect(sequentialBucket(0, 100)).toBe(1)
    expect(sequentialBucket(100, 100)).toBe(8)
    expect(sequentialBucket(50, 100)).toBe(4)
  })

  it('clamps out-of-range values into [1, steps]', () => {
    expect(sequentialBucket(-10, 100)).toBe(1)
    expect(sequentialBucket(1000, 100)).toBe(8)
  })

  it('falls back to bucket 1 when max is zero/undefined, avoiding a division by zero', () => {
    expect(sequentialBucket(5, 0)).toBe(1)
    expect(sequentialBucket(5, undefined)).toBe(1)
  })
})
