<template>
  <div class="flex flex-1 items-center gap-1.5 text-12">
    <b v-if="props.value" class="font-semibold">{{ props.value }}</b>
    <span class="mx-prog flex-1"><span :style="barStyle" /></span>
    <span v-if="props.label" class="mx-muted">{{ props.label }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  label: {},
  value: {},
  percent: {},
  getBackground: {},
})

const barStyle = computed(() => {
  const background = props.getBackground ? props.getBackground() : null
  return {
    width: `${props.percent}%`,
    ...(background ? { background: background } : {}),
  }
})
</script>
