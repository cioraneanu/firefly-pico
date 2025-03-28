<template>
  <app-select
    :label="$t('account_page.account_type')"
    popupTitle="Select an account type"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
    :getDisplayValue="getDisplayValue"
  >
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldSelect2" :size="20" />
    </template>
  </app-select>
</template>

<script setup>
import Account from '~/models/Account.js'
import { useFormAttributes } from '~/composables/useFormAttributes.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Account.typesList()

const showDropdown = ref(null)

const { t } = useI18n()
const getDisplayValue = (item) => (item.t ? t(item.t) : item.name)
</script>
