<template>
  <app-select
    :label="$t('transaction_type')"
    :popupTitle="$t('transaction_type_popup')"
    v-model="modelValue"
    v-model:showDropdown="showDropdown"
    :list="list"
    :columns="1"
    v-bind="dynamicAttrs"
    :has-search="false"
  />
</template>

<script setup>
import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'
import Transaction from '~/models/Transaction.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()
const list = Transaction.typesList

const showDropdown = ref(null)
</script>
