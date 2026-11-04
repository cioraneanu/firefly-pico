<template>
  <div role="radiogroup" class="flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option.value.code"
      type="button"
      role="radio"
      :aria-checked="isEqual(model, option.value)"
      :class="[
        'inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-[13px] font-medium transition-colors',
        isEqual(model, option.value) ? colors[option.value.code] : 'text-dim ring-1 ring-inset ring-line hover:bg-soft hover:text-fg',
      ]"
      @click="model = option.value"
    >
      <component :is="option.icon" :size="16" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { isEqual } from 'lodash-es'

const model = defineModel()
const options = useTransactionTypeOptions()

const colors = {
  expense: 'bg-expense/10 text-expense ring-[1.5px] ring-inset ring-expense',
  income: 'bg-income/10 text-income ring-[1.5px] ring-inset ring-income',
  transfer: 'bg-transfer/10 text-transfer ring-[1.5px] ring-inset ring-transfer',
}
</script>
