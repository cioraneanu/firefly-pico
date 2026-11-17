<template>
  <app-select v-model="modelValue" :label="$t('recurring_transaction_page.repetition_ends')" :popup-title="$t('recurring_transaction_page.repetition_ends')" :list="list" :has-search="false" />
</template>

<script setup>
import RecurringTransaction from '~/core/models/RecurringTransaction.js'

const modelValue = defineModel()
const list = RecurringTransaction.repetitionEndTypesList()
</script>
