<template>
  <div ref="pie" class="pie" :style="{ '--circle-colorircle-percentage': budgetLimitPercent }">
    <app-icon :icon="icon ?? TablerIconConstants.budget" :size="TablerIconConstants.defaultSize" />
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Budget from '~/models/Budget.js'
import { get } from 'lodash'

const props = defineProps({
  value: {},
})

const pie = ref(null)

const icon = computed(() => Budget.getIcon(props.value))
const budgetLimit = computed(() => Budget.getLimit(props.value))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))

// watch(
//   budgetLimitPercent,
//   async (newValue) => {
//     await nextTick()
//     pie.value.style.setProperty('--circle-colorircle-percentage', newValue)
//   },
//   { immediate: true },
// )

</script>

<style>
.pie {
  --circle-colorircle-percentage: 20; /* the percentage */
  --circle-colorircle-thickness: 5px; /* the thickness */
  --circle-color: #66bb6a; /* the color */
  --circle-size: 45px; /* the size*/

  width: var(--circle-size);
  aspect-ratio: 1/1;
  position: relative;
  display: inline-grid;
  margin: 5px;
  place-content: center;
  border-radius: 50%;
  background: #eee;
}

.pie:before,
.pie:after {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.pie:before {
  inset: 0;
  background:
    radial-gradient(farthest-side, var(--circle-color) 98%, #0000) top/var(--circle-colorircle-thickness) var(--circle-colorircle-thickness) no-repeat,
    conic-gradient(var(--circle-color) calc(var(--circle-colorircle-percentage) * 1%), #0000 0);
  mask: radial-gradient(farthest-side, #0000 calc(99% - var(--circle-colorircle-thickness)), #000 calc(100% - var(--circle-colorircle-thickness)));
}

.pie:after {
  inset: calc(50% - var(--circle-colorircle-thickness) / 2);
  background: var(--circle-color);
  transform: rotate(calc(var(--circle-colorircle-percentage) * 3.6deg - 90deg)) translate(calc(var(--circle-size) / 2 - 50%));
}

.no-round:before {
  background-size:
    0 0,
    auto;
}

.no-round:after {
  content: none;
}
</style>
