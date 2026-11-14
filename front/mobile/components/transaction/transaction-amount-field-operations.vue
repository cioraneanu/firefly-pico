<template>
  <Teleport to="#mx-portal" defer>
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
  </Teleport>
</template>

<script setup>
// Calculator keys floating above the save bar and the keyboard (design: .mx-ops). Emits the pressed operator; mousedown keeps the input focused.
// `basic` keeps only + − × ÷ (the assistant text).
const props = defineProps({
  basic: Boolean,
})
const emit = defineEmits(['result'])

const operatorsList = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
  { value: 'C', label: 'C' },
  { value: '=', label: '=' },
].slice(0, props.basic ? 4 : 6)
</script>
