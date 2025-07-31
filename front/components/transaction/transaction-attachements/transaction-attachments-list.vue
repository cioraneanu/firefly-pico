<template>
  <div class="p-2">
    <div class="font-600">Attachments</div>

    <div class="display-flex gap-1">
      <van-loading v-if="isLoading" />

      <transaction-attachment v-for="item in list" :value="item" />

      <div v-if="!isLoading" class="add-attachment p-2">
        <icon-square-plus :size="50" :stroke="0.8" />
        <input type="file" @change="onUpload" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconSquarePlus } from '@tabler/icons-vue'
import TransactionAttachment from '~/components/transaction/transaction-attachements/transaction-attachment.vue'
import AttachmentRepository from '~/repository/AttachmentRepository.js'
import { get, head } from 'lodash'
import { ref } from 'vue'
import AttachmentTransformer from '~/transformers/AttachmentTransformer.js'

const isLoading = ref(false)
const list = ref([])

const props = defineProps({
  transaction: {},
})

const transactionId = computed(() => props.transaction?.id)

const fetchAttachments = async () => {
  isLoading.value = true
  let response = await new AttachmentRepository().getForTransaction(transactionId.value)
  console.log({ response })
  if (ResponseUtils.isSuccess(response)) {
    list.value = AttachmentTransformer.transformFromApiList(response.data?.data ?? [])
  }
  isLoading.value = false
}

watch(transactionId, (newValue) => {
  fetchAttachments()
})

const onUpload = async (e) => {
  const file = head(e.target.files ?? [])
  const id = get(props.transaction, 'attributes.transactions.0.transaction_journal_id')
  await new AttachmentRepository().uploadForTransaction(id, file)
  await fetchAttachments()
}
</script>
