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
  border-radius: 12px;
  background: #f4f4f5;
  box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.06);
}

.app-tabs-item {
  min-height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #52525b;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.app-tabs-item:hover {
  color: #18181b;
}

.app-tabs-item.active {
  background: #006fee;
  color: #fff;
  box-shadow:
    0 2px 8px rgba(0, 111, 238, 0.28),
    0 1px 2px rgba(0, 0, 0, 0.08);
}

.van-theme-dark .app-tabs {
  background: #27272a;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.van-theme-dark .app-tabs-item {
  color: #d4d4d8;
}

.van-theme-dark .app-tabs-item:hover {
  color: #fff;
}

.van-theme-dark .app-tabs-item.active {
  background: #006fee;
  color: #fff;
}
</style>
