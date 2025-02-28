<template>
  <app-select :label="$t('page_select.label')" :popupTitle="$t('page_select.title')" v-model="modelValue"
    v-model:showDropdown="showDropdown" :list="list" :columns="1" v-bind="dynamicAttrs" :has-search="false" />
</template>

<script setup>
import Account from '~/models/Account'
import { useFormAttributes } from '~/composables/useFormAttributes'
import Page from '~/models/Page.js'

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)
const modelValue = defineModel()

const list = Page.typesList()
const showDropdown = ref(null)
</script>
