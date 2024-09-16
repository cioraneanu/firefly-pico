<template>
  <app-select label="Budget type" popupTitle="Select an account type" v-model="modelValue" v-model:showDropdown="showDropdown" :list="list" :columns="1" v-bind="dynamicAttrs" :has-search="false">
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldSelect2" :size="20" />
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Budget from '~/models/Budget.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Budget.typesList()

const showDropdown = ref(null)
</script>
