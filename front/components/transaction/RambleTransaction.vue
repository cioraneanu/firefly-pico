<template>
  <div class="display-flex flex-direction-column gap-1">
    <div class="display-flex flex-center-vertical gap-2 px-2">
      <div class="tag-gray text-size-12">{{ props.index + 1 }}</div>
      <van-loading v-if="isCreating" size="14" />
      <van-tag v-else-if="isCreated" type="success" size="medium">{{ $t('transaction.assistant_ramble_status_created') }}</van-tag>
      <van-tag v-else-if="isFailed" type="danger" size="medium">{{ $t('transaction.assistant_ramble_status_failed') }}</van-tag>
      <div v-if="transaction.error" class="text-size-12 text-danger word-break-word flex-1-w">{{ transaction.error }}</div>
    </div>

    <transaction-list-item :value="transaction.item" :is-detailed-mode="true" @on-edit="onEdit" @on-delete="onDelete" />
  </div>
</template>

<script setup>
import TransactionListItem from '~/components/list-items/transaction-list-item.vue'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['delete', 'edit'])
const transaction = defineModel({
  type: Object,
  required: true,
})

const isCreating = computed(() => transaction.value.status === 'creating')
const isCreated = computed(() => transaction.value.status === 'success')
const isFailed = computed(() => transaction.value.status === 'error')

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
