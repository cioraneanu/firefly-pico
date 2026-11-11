<template>
  <span class="mx-chip fill">
    <app-icon :icon="Account.getIcon(value) ?? TablerIconConstants.account" :size="12" :stroke="2" />
    <span>{{ Account.getDisplayName(value) }}</span>
  </span>
</template>

<script setup>
import Account from '~/core/models/Account.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

// Account chip (design: filled .mx-chip)
defineProps({
  value: Object,
})
</script>
