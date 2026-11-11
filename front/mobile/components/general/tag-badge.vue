<template>
  <span class="mx-chip">
    <app-icon :icon="Tag.getIcon(value) ?? TablerIconConstants.tag" :size="12" :stroke="2" />
    <span>{{ Tag.getDisplayNameEllipsized(value, maxLength) }}</span>
  </span>
</template>

<script setup>
import Tag from '~/core/models/Tag.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

// Tag chip (design: outlined .mx-chip)
defineProps({
  value: Object,
  maxLength: { default: 10 },
})
</script>
