<template>
  <div class="app-badge category-badge overflow-hidden">
    <app-icon :icon="Category.getIcon(value) ?? TablerIconConstants.category" :size="iconSize" />
    <span class="truncate">{{ Category.getDisplayName(value) }}</span>
  </div>
</template>

<script setup>
import Category from '~/core/models/Category.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

defineProps({
  value: Object,
  iconSize: {
    default: 18,
  },
})
</script>
