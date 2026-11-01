<template>
  <div v-if="transactionId" class="px-4 pb-4 pt-1">
    <div class="flex items-center font-normal text-14">
      <app-icon :icon="TablerIconConstants.attachment" :size="20" />
      {{ $t('attachments') }}
    </div>

    <div class="flex items-center flex-wrap gap-1 mt-2">
      <van-loading v-if="isLoading" />

      <transaction-attachment v-for="item in list" :key="item.id" :value="item" :read-only="readOnly" @result="fetchAttachments" @is-loading="onLoadingChange" />

      <div v-if="!isLoading && !readOnly" class="add-attachment flex items-center justify-center">
        <icon-plus :size="30" :stroke="0.8" />
        <input type="file" @change="onUpload" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import TransactionAttachment from '~/mobile/components/transaction/transaction-attachements/transaction-attachment.vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

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

const onUpload = (e) => upload(e.target.files)
const onLoadingChange = (value) => (isLoading.value = value)
</script>
