<template>
  <div class="mxr-tx" :class="statusClass">
    <div v-if="isCreating || transaction.error" class="mxr-tx__st">
      <span v-if="isCreating" class="mx-spin" />
      <span v-if="transaction.error" class="mx-ferr wrap-anywhere flex-1 min-w-0">{{ transaction.error }}</span>
    </div>

    <transaction-list-item :value="transaction.item" :is-detailed-mode="true" @on-edit="onEdit" @on-delete="onDelete" />
  </div>
</template>

<script setup>
import TransactionListItem from '~/mobile/components/list-items/transaction-list-item.vue'

// One interpreted transaction in the ramble preview: the regular transaction row plus its create status.
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
    return 'ok'
  }

  if (isFailed.value) {
    return 'err'
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
