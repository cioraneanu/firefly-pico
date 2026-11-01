<template>
  <div class="app-badge tag-badge overflow-hidden">
    <app-icon :icon="Tag.getIcon(value) ?? TablerIconConstants.tag" :size="iconSize" />
    <span class="truncate">{{ Tag.getDisplayNameEllipsized(value, maxLength) }}</span>
  </div>
</template>

<script setup>
import Tag from '~/core/models/Tag.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

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
