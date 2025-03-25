<template >
  <div class="icon-container">
    <component :is="props.icon" :style="style" :fontControlled="false" :stroke-width="props.stroke" class="svg-icon" :color-invertable="isColorInvertable" />
    <span v-if="props.badge" class="icon-badge">{{ props.badge }}</span>
  </div>
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
  badge: {
    type: String,
    default: null,
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

