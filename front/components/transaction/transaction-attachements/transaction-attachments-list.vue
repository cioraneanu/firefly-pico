<template>
  <div v-if="transactionId" class="px-3 pb-3 pt-1">
    <div class="flex-center-vertical font-400 text-size-14">
      <app-icon :icon="TablerIconConstants.attachment" :size="20" />
      {{ $t('attachments') }}
    </div>

    <div class="flex-center-vertical flex-wrap gap-1 mt-2">
      <van-loading v-if="isLoading" />

      <transaction-attachment v-for="item in list" :key="item.id" :value="item" :read-only="readOnly" @result="fetchAttachments" @is-loading="onLoadingChange" />

      <div v-if="!isLoading && !readOnly" class="add-attachment flex-center">
        <icon-plus :size="30" :stroke="0.8" />
        <input type="file" @change="onUpload" >
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import TransactionAttachment from '~/components/transaction/transaction-attachements/transaction-attachment.vue'
import AttachmentRepository from '~/repository/AttachmentRepository.js'
import { get, head } from 'lodash-es'
import { ref } from 'vue'
import AttachmentTransformer from '~/transformers/AttachmentTransformer.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const emit = defineEmits(['count'])

const isLoading = ref(false)
const list = ref([])

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

const transactionId = computed(() => props.transaction?.id)

const fetchAttachments = async () => {
  isLoading.value = true
  const response = await new AttachmentRepository().getForTransaction(transactionId.value)
  if (ResponseUtils.isSuccess(response)) {
    list.value = AttachmentTransformer.transformFromApiList(response.data?.data ?? [])
    emit('count', list.value.length)
  }
  isLoading.value = false
}

watch(
  transactionId,
  (newValue) => {
    if (newValue) {
      fetchAttachments()
    }
  },
  { immediate: true },
)

const onUpload = async (e) => {
  const file = head(e.target.files ?? [])
  const id = get(props.transaction, 'attributes.transactions.0.transaction_journal_id')
  await new AttachmentRepository().uploadForTransaction(id, file)
  await fetchAttachments()
}

const onLoadingChange = (value) => {
  isLoading.value = value
}
</script>
