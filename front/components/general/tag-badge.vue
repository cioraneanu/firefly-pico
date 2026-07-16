<template>
  <div class="app-badge tag-badge overflow-hidden">
    <app-icon :icon="Tag.getIcon(value) ?? TablerIconConstants.tag" :size="iconSize" />
    <span class="ellipse-text">{{ Tag.getDisplayNameEllipsized(value, maxLength) }}</span>
  </div>
</template>

<script setup>
import Tag from '~/models/Tag.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

defineProps({
  value: Object,
  iconSize: {
    default: 14,
  },
  maxLength: {
    default: 10,
  },
})
</script>
