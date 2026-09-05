<template>
  <div class="app-chart-frame">
    <div v-if="isRedacted" class="app-chart-frame-redacted" :style="{ height: `${height}px` }">
      <app-icon :icon="TablerIconConstants.eyeHidden" :size="20" />
    </div>

    <div v-else class="app-chart-frame-plot-wrapper">
      <div ref="containerEl" class="app-chart-frame-plot" :style="{ height: `${height}px` }" />

      <!--
        Invisible focusable overlay — uPlot's canvas has no built-in keyboard support or DOM for a
        screen reader to read (ANALYTICS_PLAN.md Part 7). Arrow keys move a synthetic cursor that
        drives the same tooltip state as hover; aria-live announces the focused point as text.
      -->
      <div
        class="app-chart-frame-overlay"
        tabindex="0"
        role="img"
        :aria-label="ariaLabel"
        @keydown.left.prevent="onFocusMove(-1)"
        @keydown.right.prevent="onFocusMove(1)"
        @focus="onFocus"
        @blur="onBlur"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @click="onClick"
      />

      <div v-if="tooltip" class="app-chart-frame-tooltip" :style="{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }">
        <slot name="tooltip" :idx="tooltip.idx" />
      </div>

      <div class="visually-hidden" aria-live="polite">
        <slot v-if="announceIdx !== null" name="tooltip" :idx="announceIdx" />
      </div>
    </div>
  </div>
</template>

<script setup>
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { resolveCssVar } from '~/utils/ChartUtils'
import { useAnalyticsStore } from '~/stores/analyticsStore'

const props = defineProps({
  uplotOptions: { type: Object, required: true }, // uPlot Options, WITHOUT width/height
  data: { type: Array, required: true }, // uPlot AlignedData: [[x...], [y1...], ...]
  height: { type: Number, default: 220 },
  ariaLabel: { type: String, required: true },
  redactWhenHidden: { type: Boolean, default: true },
})

const emit = defineEmits(['point-select'])

const analyticsStore = useAnalyticsStore()
const profileStore = useProfileStore()

const containerEl = ref(null)
const tooltip = ref(null)
const announceIdx = ref(null)
let instance = null
let resizeObserver = null

const isRedacted = computed(() => props.redactWhenHidden && analyticsStore.isAmountsHidden)

// Any series stroke/fill authored as a '--viz-*' CSS custom-property name is resolved to its
// literal computed value here — canvas fillStyle/strokeStyle do not understand var(...) the way
// SVG/CSS do (ANALYTICS_PLAN.md Part 3, "Chart rendering: uPlot integration notes").
function resolveColor(value) {
  return typeof value === 'string' && value.startsWith('--') ? resolveCssVar(value) : value
}

function buildOptions(width) {
  const series = (props.uplotOptions.series ?? []).map((s) => ({
    ...s,
    stroke: resolveColor(s.stroke),
    fill: resolveColor(s.fill),
  }))
  const axes = (props.uplotOptions.axes ?? []).map((axis) => ({
    ...axis,
    stroke: resolveColor(axis.stroke),
    grid: axis.grid ? { ...axis.grid, stroke: resolveColor(axis.grid.stroke) } : axis.grid,
  }))
  return {
    ...props.uplotOptions,
    series,
    axes,
    width,
    height: props.height,
    cursor: {
      ...props.uplotOptions.cursor,
      points: { show: false },
    },
    hooks: {
      ...props.uplotOptions.hooks,
      setCursor: [
        ...(props.uplotOptions.hooks?.setCursor ?? []),
        (u) => {
          if (u.cursor.idx == null) {
            tooltip.value = null
            return
          }
          tooltip.value = { idx: u.cursor.idx, left: u.cursor.left, top: u.cursor.top }
        },
      ],
    },
  }
}

function mount() {
  if (!containerEl.value || isRedacted.value) return
  const width = containerEl.value.clientWidth || 320
  instance = new uPlot(buildOptions(width), props.data, containerEl.value)
}

function destroy() {
  instance?.destroy()
  instance = null
}

function rebuild() {
  destroy()
  nextTick(mount)
}

onMounted(() => {
  mount()
  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect?.width
    if (width && instance) instance.setSize({ width, height: props.height })
  })
  if (containerEl.value) resizeObserver.observe(containerEl.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  destroy()
})

// Rebuild rather than u.setData() in place — setData() assumes the series COUNT/shape is
// unchanged, but switching dimension (categories/tags) or the top-N ranking changes series
// definitions (count, ids, per-series stacking closures) along with the data at the same time.
// Applying new data against a stale series config is exactly what produced orphaned/misaligned
// bar segments when toggling tabs. Full rebuild is cheap at this data scale (same trade-off
// already made for the dark-mode toggle below).
watch([() => props.uplotOptions, () => props.data], rebuild)
watch(isRedacted, (redacted) => (redacted ? destroy() : nextTick(mount)))
// A dark-mode toggle changes what every '--viz-*' token resolves to — uPlot has no reactive
// re-theming, so the instance is fully rebuilt rather than patched in place.
watch(() => profileStore.darkTheme, rebuild)

function onPointerMove(event) {
  if (!instance) return
  // cursor.left/top are relative to uPlot's OWN plotting rectangle (.u-over, exposed as
  // instance.over), which is inset from the container by the y-axis label gutter — measuring
  // against the container's own rect here offsets the crosshair right/down by that gutter.
  const rect = instance.over.getBoundingClientRect()
  instance.setCursor({ left: event.clientX - rect.left, top: event.clientY - rect.top })
}

function onPointerLeave() {
  instance?.setCursor({ left: -10, top: -10 })
}

function onFocus() {
  onFocusMove(0)
}

function onBlur() {
  tooltip.value = null
  announceIdx.value = null
}

function onFocusMove(delta) {
  if (!instance) return
  const lastIdx = props.data[0]?.length - 1 ?? 0
  const currentIdx = tooltip.value?.idx ?? -1
  const nextIdx = Math.min(Math.max(currentIdx + delta, 0), lastIdx)
  const left = instance.valToPos(props.data[0][nextIdx], 'x')
  instance.setCursor({ left, top: 0 })
  announceIdx.value = nextIdx
}

function onClick() {
  if (!instance || tooltip.value?.idx == null) return
  const idx = tooltip.value.idx
  const val = instance.posToVal(tooltip.value.top, instance.series[1]?.scale ?? 'y')
  emit('point-select', { idx, val })
}
</script>

<style scoped>
.app-chart-frame-plot-wrapper {
  position: relative;
}

.app-chart-frame-plot {
  width: 100%;
}

.app-chart-frame-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  outline: none;
}

.app-chart-frame-overlay:focus-visible {
  outline: 2px solid var(--primary-action);
  outline-offset: -2px;
}

.app-chart-frame-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: none;
  background: var(--white);
  color: var(--black);
  border: 1px solid var(--viz-grid-baseline);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.app-chart-frame-redacted {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
  border-radius: 8px;
  color: var(--semi-black);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
