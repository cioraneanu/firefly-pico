<template>
  <div class="ramble-transaction-item" :class="statusClass">
    <div v-if="isCreating || transaction.error" class="flex items-center gap-2 px-4 pt-2">
      <van-loading v-if="isCreating" size="14" />
      <div v-if="transaction.error" class="text-12 text-[#dc3545] wrap-anywhere flex-1 min-w-0">{{ transaction.error }}</div>
    </div>

    <transaction-list-item :value="transaction.item" :is-detailed-mode="true" @on-edit="onEdit" @on-delete="onDelete" />
  </div>
</template>

<script setup>
import TransactionListItem from '~/mobile/components/list-items/transaction-list-item.vue'

const emit = defineEmits(['delete', 'edit'])
const transaction = defineModel({
  type: Object,
  required: true,
})

const isCreating = computed(() => transaction.value.status === 'creating')
const isCreated = computed(() => transaction.value.status === 'success')
const isFailed = computed(() => transaction.value.status === 'error')

const statusClass = computed(() => {
  if (isCreated.value) {
    return 'ramble-transaction-item-success'
  }

  if (isFailed.value) {
    return 'ramble-transaction-item-error'
  }

  return null
})

const onDelete = () => {
  if (isCreating.value) {
    return
  }

  emit('delete', transaction.value)
}

const onEdit = () => {
  emit('edit', transaction.value)
}
</script>
