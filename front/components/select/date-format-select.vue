<template>
  <app-select v-model="modelValue" v-model:show-dropdown="showDropdown" label="Date display" :list="list" :columns="1" v-bind="dynamicAttrs" :has-search="false" />
</template>

<script setup>
import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()

const list = Account.roleAssetsList()
const showDropdown = ref(null)
</script>
