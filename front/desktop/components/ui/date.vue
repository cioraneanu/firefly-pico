<template>
  <d-input v-model="text" :type="time ? 'datetime-local' : 'date'" :icon="IconCalendar" :clearable class="w-fit" />
</template>

<script setup>
import { IconCalendar } from '@tabler/icons-vue'
import { format, isValid, parseISO } from 'date-fns'

const model = defineModel()
const props = defineProps({ time: Boolean, clearable: Boolean })

const pattern = computed(() => (props.time ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd'))

const date = computed(() => DateUtils.autoToDate(model.value))

const text = computed({
  get: () => (isValid(date.value) ? format(date.value, pattern.value) : ''),
  set: (value) => (model.value = value ? parseISO(value) : null),
})
</script>
