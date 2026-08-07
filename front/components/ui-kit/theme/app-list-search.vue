<template>
  <div class="app-list-search flex-center-vertical gap-2">
    <slot name="left" />
    <van-search v-model="modelValue" class="flex-1" :placeholder="$t('search_placeholder')" />
    <slot name="right" />
  </div>
</template>

<script setup>
const modelValue = defineModel()
</script>

<style scoped>
.app-list-search {
  padding: 10px 12px;
}

.app-list-search :deep(.van-search) {
  padding: 0;
  background: transparent;
}

.app-list-search :deep(.van-search__content) {
  border-radius: 10px;
  background: var(--white);
  box-shadow: rgba(0, 0, 0, 0.06) 0px 0px 4px;
}
</style>
