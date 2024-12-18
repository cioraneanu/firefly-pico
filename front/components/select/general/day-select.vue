<template>
  <app-select
    label="First day of the week"
    popupTitle="Select the first day of the week"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
  >
  </app-select>
</template>

<script setup>
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { format, startOfWeek, addDays } from 'date-fns'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

// TODO: Convert it to just the day index
const modelValue = defineModel()

const list = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(startOfWeek(new Date()), i)
  return { value: i, name: format(date, 'EEEE') }
})

const showDropdown = ref(null)
</script>
