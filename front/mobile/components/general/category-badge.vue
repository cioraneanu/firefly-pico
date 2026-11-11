<template>
  <span class="mx-chip">
    <app-icon :icon="Category.getIcon(value) ?? TablerIconConstants.category" :size="12" :stroke="2" />
    <span>{{ Category.getDisplayName(value) }}</span>
  </span>
</template>

<script setup>
import Category from '~/core/models/Category.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

// Category chip (design: outlined .mx-chip)
defineProps({
  value: Object,
})
</script>
