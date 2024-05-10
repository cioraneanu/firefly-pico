<template>
  <component :is="props.icon" :fontControlled="false" :style="style" :stroke-width="props.stroke" />
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
  },
  size: {
    default: 25,
  },

  // Only for Tablr
  stroke: {
    default: 1.7,
  },
})

const style = computed(() => `width: ${props.size}px`)
</script>

<style></style>
