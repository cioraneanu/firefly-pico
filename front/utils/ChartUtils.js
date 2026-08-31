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

// hex: '#rrggbb' (what resolveCssVar() returns for every --viz-* token). Canvas fillStyle has no
// CSS-var-plus-opacity composition the way `color-mix`/CSS does, so area washes (Part 1: "~10%
// opacity") need a literal rgba string built from the already-resolved hex.
export function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Maps a magnitude to one of the 8 discrete --viz-sequential-N steps (1-indexed, clamped) — the
// heatmap's color scale, kept as fixed token steps rather than continuous canvas interpolation to
// match the categorical/diverging palette's existing "discrete tokens" design.
export function sequentialBucket(value, max, steps = 8) {
  if (!max || max <= 0) return 1
  const ratio = Math.min(1, Math.max(0, value / max))
  return Math.max(1, Math.min(steps, Math.ceil(ratio * steps)))
}

// Draws one emphasized horizontal hairline at a given data value (zero baseline, a target rate,
// etc.) — shared by app-chart-bars.vue's zero baseline and app-chart-line.vue's target rule so
// the canvas-line-drawing code exists in exactly one place.
export function drawHorizontalRule(u, { value, colorVar, scaleKey = 'y' }) {
  if (value == null) return
  const y = u.valToPos(value, scaleKey, true)
  const { left, width } = u.bbox
  u.ctx.save()
  u.ctx.strokeStyle = resolveCssVar(colorVar)
  u.ctx.lineWidth = 1
  u.ctx.beginPath()
  u.ctx.moveTo(left, y)
  u.ctx.lineTo(left + width, y)
  u.ctx.stroke()
  u.ctx.restore()
}
