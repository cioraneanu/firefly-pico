<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    :label="$t('recurring_transaction_page.weekday')"
    :popup-title="$t('recurring_transaction_page.weekday')"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
  >
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.settingsUserPreferencesDate" :size="20" />
    </template>
  </app-select>
</template>

<script setup>
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = RecurringTransaction.weekdaysList()

const showDropdown = ref(null)
</script>
