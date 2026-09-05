<template>
  <div :class="computedClass">
    <div class="subtitle font-weight-600">{{ props.value }}</div>
    <div class="bar-container">
      <div class="bar-filled" :style="barStyle" />
    </div>
    <div class="subtitle">{{ props.label }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: {},
  value: {},
  percent: {},
  getBackground: {},
})

const appStore = useAppStore()

const barStyle = computed(() => {
  const background = props.getBackground ? props.getBackground() : null
  return {
    height: `${props.percent}%`,
    ...(background ? { background: background } : {}),
  }
})

const computedClass = computed(() => ({
  'bar-container-vertical display-flex flex-column align-items-center gap-1': true,
  'flex-1': !appStore.isDesktopLayout,
}))
</script>
