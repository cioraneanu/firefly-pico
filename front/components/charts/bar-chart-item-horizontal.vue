<template>
  <div class="bar-container-horizontal display-flex align-items-center gap-1 flex-1">
    <div v-if="props.value" class="subtitle font-weight-600">{{ props.value }}</div>
    <div class="bar-container">
      <div class="bar-filled" :style="barStyle"/>
    </div>
    <div v-if="props.label" class="subtitle">{{ props.label }}</div>
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
  let background = props.getBackground ? props.getBackground() : null
  return {
    width: `${props.percent}%`,
    ...(background ? { background: background } : {}),
  }
})
</script>

