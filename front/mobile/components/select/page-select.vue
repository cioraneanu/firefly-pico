<template>
  <app-select v-model="modelValue" :label="$t('page_select.label')" :popup-title="$t('page_select.title')" :list="list" :has-search="false" :get-display-value="getDisplayValue" />
</template>

<script setup>
import Page from '~/core/models/Page.js'

const modelValue = defineModel()
const { t } = useI18n()

const list = Page.typesList()

const getDisplayValue = (item) => item.name ?? t(item.t)
</script>
