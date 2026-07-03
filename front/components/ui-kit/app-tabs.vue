<template>
  <div class="app-tabs" role="tablist">
    <button
      v-for="item in items"
      :key="String(item.value)"
      type="button"
      class="app-tabs-item"
      :class="{ active: item.value === modelValue }"
      :aria-selected="item.value === modelValue"
      role="tab"
      @click="modelValue = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
const modelValue = defineModel({
  type: [String, Number, Boolean],
  default: null,
})

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.app-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 0;
  border-radius: 999px;
  background: var(--van-background-2-5);
  box-shadow: inset 0 0 0 1px rgba(120, 120, 128, 0.12);
}

.app-tabs-item {
  min-height: 30px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--van-text-color-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.app-tabs-item:hover {
  color: var(--van-text-color);
}

.app-tabs-item.active {
  background: var(--van-cell-background);
  color: var(--van-text-color);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
