<template>
  <div :class="iconTypeClass" />
</template>

<script setup>

import { isEqual } from 'lodash'
import Transaction from '~/models/Transaction.js'

const props = defineProps({
  transactionType: {}
})

const isTransactionExpense = computed(() => isEqual(props.transactionType, Transaction.types.expense))
const isTransactionIncome = computed(() => isEqual(props.transactionType, Transaction.types.income))
const isTransactionTransfer = computed(() => isEqual(props.transactionType, Transaction.types.transfer))
const iconTypeClass = computed(() => {
  return {
    'icon-type': true,
    'color-expense': isTransactionExpense.value,
    'color-income': isTransactionIncome.value,
    'color-transfer': isTransactionTransfer.value,
  }
})

</script>

