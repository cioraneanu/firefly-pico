<template>
  <app-select v-model="modelValue" :label="$t('budget_page.type')" :popup-title="$t('budget_page.type')" :list="list" :has-search="false" />
</template>

<script setup>
import Budget from '~/core/models/Budget.js'

const modelValue = defineModel()
const list = Budget.typesList()
</script>
