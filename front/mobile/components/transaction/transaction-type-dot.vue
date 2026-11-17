<template>
  <span class="mx-dot" :class="typeClass" />
</template>

<script setup>
import { isEqual } from 'lodash-es'
import Transaction from '~/core/models/Transaction.js'

const props = defineProps({
  transactionType: {},
})

const typeClass = computed(() => ({
  exp: isEqual(props.transactionType, Transaction.types.expense),
  inc: isEqual(props.transactionType, Transaction.types.income),
  tr: isEqual(props.transactionType, Transaction.types.transfer),
}))
</script>
