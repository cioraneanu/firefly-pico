<template>
  <div class="app-chip flex flex-col items-center">
    <div v-if="title" class="title font-semibold">{{ title }}</div>
    <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup>
import DateUtils from '~/core/utils/DateUtils'
import { addDays, startOfDay, subYears } from 'date-fns'
import { useFormAttributes } from '~/core/composables/useFormAttributes'
import { useSwipeToDismiss } from '~/mobile/composables/useSwipeToDismiss.js'

const props = defineProps({
  title: {
    type: String,
  },
  subtitle: {
    type: String,
  },
})
</script>
