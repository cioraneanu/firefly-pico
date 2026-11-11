<template>
  <app-select v-model="modelValue" :label="$t('day_select.label')" :popup-title="$t('day_select.title')" :list="list" :has-search="false" />
</template>

<script setup>
import { addDays, format, startOfWeek } from 'date-fns'
import { capitalize } from 'lodash-es'

// Internally use { value, name }, externally emit just the value as int
const modelValue = defineModel({
  set: (value) => value?.value,
  get: (value) => list.value.find((item) => item.value === value),
})

const list = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i)
    return { value: i, name: capitalize(format(date, 'EEEE')) }
  }),
)
</script>
