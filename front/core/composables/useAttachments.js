import { get, head } from 'lodash-es'
import AttachmentRepository from '~/core/repository/AttachmentRepository'
import AttachmentTransformer from '~/core/transformers/AttachmentTransformer'
import { downloadFileFromUrl, showImageFromUrl } from '~/core/utils/AttachmentUtils'

export function useAttachments(transaction) {
  const repository = new AttachmentRepository()
  const list = ref([])
  const isLoading = ref(false)
  const transactionId = computed(() => toValue(transaction)?.id)

  const fetch = async () => {
    isLoading.value = true
    const response = await repository.getForTransaction(transactionId.value)
    if (ResponseUtils.isSuccess(response)) list.value = AttachmentTransformer.transformFromApiList(response.data?.data ?? [])
    isLoading.value = false
  }

  const upload = async (files) => {
    await repository.uploadForTransaction(get(toValue(transaction), 'attributes.transactions.0.transaction_journal_id'), head(files ?? []))
    await fetch()
  }

  const open = async (attachment) => {
    isLoading.value = true
    const { download_url: url, filename, mime } = attachment.attributes ?? {}
    await (mime?.startsWith('image/') ? showImageFromUrl(url) : downloadFileFromUrl(url, filename)).catch(() => null)
    isLoading.value = false
  }

  const remove = async (attachment) => {
    await repository.delete(attachment.id)
    await fetch()
  }

  watch(transactionId, (id) => id && fetch(), { immediate: true })

  return { list, isLoading, fetch, upload, open, remove }
}
