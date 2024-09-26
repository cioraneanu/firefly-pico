<template>
  <div ref="budget-icon" class="budget-icon" :style="{ '--budget-percent': budgetLimitPercent }">
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


const icon = computed(() => Budget.getIcon(props.value))
const budgetLimit = computed(() => Budget.getLimit(props.value))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))

</script>

<style>
.budget-icon {
  --budget-percent: 20; /* the percentage */
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
}

.budget-icon:before,
.budget-icon:after {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.budget-icon:before {
  inset: 0;
  background:
    radial-gradient(farthest-side, var(--circle-color) 98%, #0000) top/var(--circle-colorircle-thickness) var(--circle-colorircle-thickness) no-repeat,
    conic-gradient(var(--circle-color) calc(var(--budget-percent) * 1%), #0000 0);
  mask: radial-gradient(farthest-side, #0000 calc(99% - var(--circle-colorircle-thickness)), #000 calc(100% - var(--circle-colorircle-thickness)));
}

.budget-icon:after {
  inset: calc(50% - var(--circle-colorircle-thickness) / 2);
  background: var(--circle-color);
  transform: rotate(calc(var(--budget-percent) * 3.6deg - 90deg)) translate(calc(var(--circle-size) / 2 - 50%));
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
