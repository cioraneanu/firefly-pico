<template>
  <app-select v-model="modelValue" :label="$t('budget_page.period')" :popup-title="$t('budget_page.period')" :list="list" :has-search="false" />
</template>

<script setup>
import Budget from '~/core/models/Budget.js'

const modelValue = defineModel()
const list = Budget.periodsList()
</script>
