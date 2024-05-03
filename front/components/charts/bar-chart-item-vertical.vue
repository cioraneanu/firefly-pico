<template>
<div class="bar-container-vertical display-flex flex-column align-items-center gap-1 flex-1">
    <div class="subtitle font-weight-600">{{ props.value }}</div>
    <div class="bar-container">
      <div class="bar-filled" :style="barStyle"/>
    </div>
    <div class="subtitle">{{ props.label }}</div>
  </div>
</template>


<script setup>

const props = defineProps({
  label: {},
  value: {},
  percent: {},
})

const barStyle = computed(() => {
  return `height: ${props.percent}%`
})
</script>

