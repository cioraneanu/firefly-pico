<template>
  <component :is="props.icon" :fontControlled="false" :style="style" :stroke-width="props.stroke" class="svg-icon" :color-invertable="isColorInvertable" />
</template>

<script setup>
import Icon from '~/models/Icon.js'

const props = defineProps({
  icon: {
    type: String,
  },
  size: {
    default: 25,
  },

  // Only for TablerIcons
  stroke: {
    default: 1.7,
  },
})

const style = computed(() => `width: ${props.size}px; height: ${props.size}px`)

const isColorInvertable = computed(() => {
  if (Icon.isTypeTabler(props.icon) || Icon.isTypeAvatar(props.icon) ||  Icon.isTypeFlag(props.icon)) {
    return false
  }
  return true
})
</script>

