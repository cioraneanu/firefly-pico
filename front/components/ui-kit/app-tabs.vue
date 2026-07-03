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
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--van-border-color);
  border-radius: 8px;
  background: var(--van-background-2-5);
}

.app-tabs-item {
  min-height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--van-text-color-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.app-tabs-item.active {
  background: var(--van-cell-background);
  color: var(--van-text-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
