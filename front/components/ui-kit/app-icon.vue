<template>
  <!-- Custom icons are admin files => <img> never runs scripts embedded in an SVG -->
  <img v-if="customIconUrl" class="svg-icon" :style="style" :src="customIconUrl" alt="" />
  <component :is="props.icon" v-else :font-controlled="false" :style="style" :stroke-width="props.stroke" class="svg-icon" :color-invertable="isColorInvertable" />
</template>

<script setup>
import Icon from '~/models/Icon.js'
import CustomIconRepository from '~/repository/CustomIconRepository.js'

const props = defineProps({
  icon: {
    // type: String,
  },
  size: {
    default: 25,
  },

  // Only for TablerIcons
  stroke: {
    default: 1.7,
  },
  invertable: {
    type: Boolean,
    default: null,
  },
})

const style = computed(() => `width: ${props.size}px; height: ${props.size}px`)

const iconName = computed(() => (typeof props.icon === 'string' ? props.icon : null))

const customIconUrl = computed(() => (Icon.isTypeCustom(iconName.value) ? new CustomIconRepository().getFileUrl(Icon.getCustomIconFile(iconName.value)) : null))

const isColorInvertable = computed(() => {
  if (props.invertable !== null) {
    return props.invertable
  }
  if (typeof props.icon === 'object') {
    return true
  }
  if (Icon.isTypeTabler(props.icon) || Icon.isTypeAvatar(props.icon) || Icon.isTypeFlag(props.icon)) {
    return false
  }
  return true
})
</script>
