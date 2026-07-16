<template>
  <div class="app-badge account-badge overflow-hidden">
    <app-icon :icon="Account.getIcon(value) ?? TablerIconConstants.account" :size="iconSize" />
    <span class="ellipse-text">{{ Account.getDisplayName(value) }}</span>
  </div>
</template>

<script setup>
import Account from '~/models/Account.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

defineProps({
  value: Object,
  iconSize: {
    default: 13,
  },
})
</script>
