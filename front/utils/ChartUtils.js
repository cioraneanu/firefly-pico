import { ANALYTICS_CATEGORICAL_COLOR_SLOTS } from '~/constants/AnalyticsConstants'

// Deliberately Vue/Pinia-free, matching AnalyticsUtils.js's convention — uPlot itself owns
// scaling/ticks/path rendering (see ANALYTICS_PLAN.md Part 3, "Chart rendering: uPlot
// integration notes"), so this file is intentionally small: just the CSS-token <-> canvas-color
// bridge, the slot->token naming convention, and pure stacked-bar prep math.

// uPlot's bars path builder radius is a 0-0.5 corner-radius FACTOR of bar size, not a raw px
// value — this only approximates Part 1's "4px rounded data-end" at typical bar widths.
export const CHART_BAR_SIZE_FACTOR = [0.6, 24, 4] // uPlot bars() `size` triplet: [factor, maxPx, minPx]
export const CHART_BAR_RADIUS = 0.15
export const CHART_LINE_WIDTH = 2
export const CHART_AREA_ALPHA = 0.1

// Resolves a CSS custom property (e.g. '--viz-income') to its literal computed value (e.g.
// '#008300'). Canvas 2D's fillStyle/strokeStyle do not understand var(...) references the way
// SVG/CSS do, so every chart color has to be resolved through this before reaching uPlot.
export function resolveCssVar(varName, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(varName).trim()
}

// slot: output of AnalyticsUtils.assignColorSlots() — a 0-based index or the string 'other'.
// Returns the CSS var NAME (not a var(...) wrapper) — DOM/CSS consumers wrap it themselves
// (`var(${seriesColor(slot)})`), canvas consumers pass it straight to resolveCssVar().
export function seriesColor(slot, maxSlots = ANALYTICS_CATEGORICAL_COLOR_SLOTS) {
  if (slot === 'other' || slot == null || slot >= maxSlots) return '--viz-other'
  return `--viz-categorical-${slot + 1}`
}

// Pure cumulative-sum prep for stacked bars. rows: {key, isLoaded, values: Record<id, number>}[].
// seriesIds: ordered id list to stack bottom-to-top (typically top-N + 'other' last). Returns one
// {from, to} band per row per id, ready to feed uPlot bars() `disp.y0`/`disp.y1` facets.
export function stackSeries(rows, seriesIds) {
  return rows.map((row) => {
    let cumulative = 0
    const bands = {}
    for (const id of seriesIds) {
      const value = row.values?.[id] ?? 0
      bands[id] = { from: cumulative, to: cumulative + value }
      cumulative += value
    }
    return { key: row.key, isLoaded: row.isLoaded, bands, total: cumulative }
  })
}
