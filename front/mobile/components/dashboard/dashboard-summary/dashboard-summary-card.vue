<template>
  <van-grid-item class="cursor-pointer">
    <template #icon>
      <app-icon :icon="icon" :size="24" />
    </template>
    <template #text>
      <div class="flex flex-col items-center">
        <div class="font-normal text-12 text-center text-muted">{{ title }}</div>
        <div :class="subtitleClass">{{ subtitle }}</div>
      </div>
    </template>
  </van-grid-item>
</template>
<script setup>
const props = defineProps({
  title: {},
  subtitle: {},
  subtitleClass: {},
  icon: {},
})

const subtitleClass = computed(() => {
  return `font-bold text-12 text-center ${props.subtitleClass}`
})
</script>
