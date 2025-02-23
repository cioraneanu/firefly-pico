<template>
  <app-select
    label="Language select"
    popupTitle="Select your language"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
  >
    <template #item="{item}">
      {{ item.displayName}}
    </template>

    <template #inputItemContent="{item}">
      {{ item.displayName}}
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { format, startOfWeek, addDays } from 'date-fns'
import { supportedLanguages } from '~/i18n/index.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

// Internally use the language object, externaly use just the code: "en"
const modelValue = defineModel({
  set: (value) => {
    return value.code
  },
  get: (value) => {
    return list.value.find((item) => item.code === value)
  },
})

const list = computed(() => supportedLanguages)

const showDropdown = ref(null)
</script>
