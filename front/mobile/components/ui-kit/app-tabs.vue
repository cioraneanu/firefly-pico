<template>
  <div class="mx-seg" role="tablist">
    <button
      v-for="item in items"
      :key="String(item.value)"
      type="button"
      role="tab"
      :class="{ on: item.value === modelValue }"
      :aria-selected="item.value === modelValue"
      @click="modelValue = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
// Segmented control (design: .mx-seg, inverted active segment).
const modelValue = defineModel({ type: [String, Number, Boolean], default: null })

defineProps({
  items: { type: Array, default: () => [] },
})
</script>
