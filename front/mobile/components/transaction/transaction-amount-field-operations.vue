<template>
  <div class="mx-ops" role="group" :aria-label="$t('transaction.calculator')">
    <button
      v-for="operator in operatorsList"
      :key="operator.value"
      type="button"
      :class="{ eq: operator.value === '=' }"
      :aria-label="operator.value"
      @mousedown.prevent.stop="emit('result', operator)"
    >
      {{ operator.label }}
    </button>
  </div>
</template>

<script setup>
// Calculator keys under the amount input (design: .mx-ops). Emits the pressed operator; mousedown keeps the input focused.
const emit = defineEmits(['result'])

const operatorsList = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
  { value: 'C', label: 'C' },
  { value: '=', label: '=' },
]
</script>
