<template>
  <span class="mx-lead">
    <app-icon :icon="Budget.getIcon(value) ?? TablerIconConstants.budget" :size="18" :stroke="2" />
  </span>
</template>

<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Budget from '~/core/models/Budget.js'

// Budget lead tile (design: .mx-lead). The spent percentage is shown by the row's .mx-prog bar.
defineProps({
  value: {},
})
</script>
