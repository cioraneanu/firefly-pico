<template>
  <div v-if="transactionId" class="mx-f">
    <div class="mx-l">
      {{ $t('attachments') }}
      <span v-if="list.length" class="mx-badge">{{ list.length }}</span>
      <span v-if="isLoading" class="mx-spin hint" />
    </div>

    <div v-if="list.length" class="mx-list">
      <transaction-attachment v-for="item in list" :key="item.id" :value="item" :read-only="readOnly" @result="fetchAttachments" @is-loading="onLoadingChange" />
    </div>

    <div v-if="!readOnly" class="mx-2" :class="{ 'pointer-events-none opacity-50': isLoading }">
      <label class="mx-btn dash">
        <app-icon :icon="IconPhotoPlus" :size="16" :stroke="2" />
        <span>{{ $t('transaction.attachment_take_photo') }}</span>
        <input type="file" accept="image/*" capture="environment" class="hidden" @change="onUpload" />
      </label>
      <label class="mx-btn dash">
        <app-icon :icon="IconFileUpload" :size="16" :stroke="2" />
        <span>{{ $t('desktop.add_file') }}</span>
        <input type="file" class="hidden" @change="onUpload" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { IconFileUpload, IconPhotoPlus } from '@tabler/icons-vue'
import TransactionAttachment from '~/mobile/components/transaction/transaction-attachements/transaction-attachment.vue'

// Attachments of a saved transaction (design: MX-Attachments): one row per file, then "take photo" / "add file".
const emit = defineEmits(['count'])

const props = defineProps({
  transaction: {
    type: Object,
    default: () => ({}),
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const { list, isLoading, fetch: fetchAttachments, upload } = useAttachments(() => props.transaction)
const transactionId = computed(() => props.transaction?.id)

watch(list, (value) => emit('count', value.length))

const onUpload = async (event) => {
  await upload(event.target.files)
  event.target.value = ''
}
const onLoadingChange = (value) => (isLoading.value = value)
</script>
