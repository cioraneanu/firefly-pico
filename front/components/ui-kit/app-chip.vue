<template>
  <div class="app-chip display-flex gap-1">
    <div v-if="title" class="title">{{ title }}</div>
    <div v-if="subtitle" class="subtitle text-muted">{{ subtitle }}</div>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import DateUtils from '~/utils/DateUtils'
import { addDays, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/composables/useFormAttributes'
import { useSwipeToDismiss } from '~/composables/useSwipeToDismiss.js'

const props = defineProps({
  title: {
    type: String,
  },
  subtitle: {
    type: String,
  },
})
</script>
