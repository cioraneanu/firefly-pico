<template>
  <div class="app-chip flex flex-col items-center">
    <div v-if="title" class="title font-semibold">{{ title }}</div>
    <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup>
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
