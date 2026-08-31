<template>
  <div class="bar-diverging-track">
    <div class="bar-diverging-zero" />
    <div class="bar-diverging-fill" :style="fillStyle" />
  </div>
</template>

<script setup>
// Sibling to bar-chart-item-horizontal.vue for Part 1's "diverging bars centred on zero" form
// (month-over-month change, spending drift) — same bare-track idiom (callers place icon/label/
// value text in their own table cells, same as bar-chart-item-horizontal.vue's own usage), but
// centred at 50% and filling toward either side instead of a single left-anchored fill.
const props = defineProps({
  value: { type: Number, required: true }, // signed
  max: { type: Number, required: true }, // largest |value| across the list this bar belongs to
})

const fillStyle = computed(() => {
  const percent = props.max > 0 ? (Math.min(Math.abs(props.value), props.max) / props.max) * 50 : 0
  // Text never wears the series colour (Part 1 mark spec) — direction is carried by the fill's
  // side/colour only. Red = spent more / trending up, blue = spent less / trending down, reusing
  // the already-validated --viz-expense/--viz-transfer tokens rather than new diverging hues.
  return props.value >= 0 ? { left: '50%', width: `${percent}%`, background: 'var(--viz-expense)' } : { left: `${50 - percent}%`, width: `${percent}%`, background: 'var(--viz-transfer)' }
})
</script>

<style scoped>
.bar-diverging-track {
  position: relative;
  height: 12px;
  width: 100%;
  background: var(--chart-bar-background);
  border-radius: 3px;
}

.bar-diverging-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 3px;
}

.bar-diverging-zero {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: var(--viz-grid-baseline);
}
</style>
