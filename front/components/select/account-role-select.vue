<template>
  <app-select label="Account role" popupTitle="Select an account role" v-model="modelValue" v-model:showDropdown="showDropdown" :list="list" :columns="1" v-bind="dynamicAttrs" :has-search="false">
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldSelect2" :size="20" />
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()

const list = Account.roleAssetsList()
const showDropdown = ref(null)
</script>
