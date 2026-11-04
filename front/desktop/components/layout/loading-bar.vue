<template>
  <div v-if="loadingStore.isLoadingDelayed" class="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden">
    <div class="d-progress h-full w-1/4 bg-primary" />
  </div>
</template>

<script setup>
const loadingStore = useLoadingStore()
</script>
