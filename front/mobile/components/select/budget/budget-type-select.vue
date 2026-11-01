<template>
  <app-select v-model="modelValue" v-model:show-dropdown="showDropdown" :label="$t('budget_page.type')" :popup-title="$t('budget_page.type')" :list="list" :columns="1" v-bind="dynamicAttrs" :has-search="false">
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldSelect2" :size="20" />
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/core/models/Account.js'
import { useFormAttributes } from '~/core/composables/useFormAttributes.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Budget from '~/core/models/Budget.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Budget.typesList()

const showDropdown = ref(null)
</script>
