import { cloneDeep } from 'lodash-es'
import AssistantRepository from '~/core/repository/AssistantRepository'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import { useRambleTransactionResolver } from '~/core/composables/useRambleTransactionResolver'
import { useTransactionAssistantDraft } from '~/core/composables/useTransactionAssistantDraft'

export const rambleStatus = { pending: 'pending', creating: 'creating', success: 'success', error: 'error' }

const isResponseSuccessful = (response) => response?.status >= 200 && response?.status < 300
const getRambleErrorMessage = (error) => error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.message ?? 'Assistant LLM request failed.'
const getCreateErrorMessage = (error) =>
  error?.data?.payload?.message ??
  error?.response?.data?.payload?.message ??
  error?.response?.data?.message ??
  error?.response?.data?.error?.message ??
  error?.data?.message ??
  error?.message ??
  'Failed to create transaction.'

export function useRamble({ onCreated } = {}) {
  const { t } = useI18n()
  const profileStore = useProfileStore()
  const appStore = useAppStore()
  const assistantRepository = new AssistantRepository()
  const transactionRepository = new TransactionRepository()
  const { getRambleContext, resolveRambleTransaction } = useRambleTransactionResolver()
  const { buildTransactionItemFromAssistant } = useTransactionAssistantDraft()

  const rambleText = ref('')
  const savedRambles = ref([])
  const loadedSavedRambleIds = ref([])
  const savedRamblesCount = ref(0)
  const isLoadingSavedRambles = ref(false)
  const isDeletingLoadedSavedRambles = ref(false)
  const rambleTransactions = ref([])
  const isInterpreting = ref(false)
  const isCreatingRambleTransactions = ref(false)
  const hasInterpreted = ref(false)
  const rambleError = ref('')
  const currentCreateIndex = ref(0)
  const sessionId = ref(0)

  const countByStatus = (status) => rambleTransactions.value.filter((transaction) => transaction.status === status).length
  const hasLoadedSavedRambles = computed(() => loadedSavedRambleIds.value.length > 0)
  const createdCount = computed(() => countByStatus(rambleStatus.success))
  const failedCount = computed(() => countByStatus(rambleStatus.error))
  const processedCount = computed(() => createdCount.value + failedCount.value)
  const createButtonCount = computed(() => rambleTransactions.value.length - createdCount.value)
  const hasCreateProgress = computed(() => isCreatingRambleTransactions.value || processedCount.value > 0)
  const createProgressPercentage = computed(() => (rambleTransactions.value.length ? Math.round((processedCount.value / rambleTransactions.value.length) * 100) : 0))

  const createProgressLabel = computed(() => {
    const total = rambleTransactions.value.length
    if (isCreatingRambleTransactions.value) return t('transaction.assistant_ramble_progress_creating', { current: currentCreateIndex.value, total })
    if (failedCount.value > 0) return t('transaction.assistant_ramble_progress_failed', { created: createdCount.value, total, failed: failedCount.value })
    return t('transaction.assistant_ramble_progress', { created: createdCount.value, total })
  })

  const createButtonLabel = computed(() =>
    failedCount.value > 0 ? t('transaction.assistant_ramble_retry_failed', { count: createButtonCount.value }) : t('transaction.assistant_ramble_create', { count: createButtonCount.value }),
  )

  const refreshSavedRambleCount = async ({ showLoading = false } = {}) => {
    if (!appStore.llmIsConfigured) return
    const response = await assistantRepository.getSavedRambleCount({ showLoading })
    savedRamblesCount.value = response.count ?? savedRambles.value.length
  }

  const fetchSavedRambles = async () => {
    const session = sessionId.value
    isLoadingSavedRambles.value = true
    try {
      const response = await assistantRepository.getSavedRambles()
      if (session !== sessionId.value) return
      savedRambles.value = response.data ?? []
      loadedSavedRambleIds.value = savedRambles.value.map((ramble) => ramble.id).filter(Boolean)
      savedRamblesCount.value = savedRambles.value.length
    } finally {
      if (session === sessionId.value) isLoadingSavedRambles.value = false
    }
  }

  const deleteLoadedSavedRambles = async ({ confirm = true } = {}) => {
    const session = sessionId.value
    const loadedIds = [...loadedSavedRambleIds.value]
    if (loadedIds.length === 0) return true
    if (confirm && !(await UIUtils.showDeleteConfirmation(t('transaction.assistant_ramble_delete_confirm_title'), t('transaction.assistant_ramble_delete_confirm_message')))) return false

    isDeletingLoadedSavedRambles.value = true
    try {
      const response = await assistantRepository.deleteSavedRambles(loadedIds)
      if (session !== sessionId.value) return false
      if (isResponseSuccessful(response)) {
        savedRambles.value = savedRambles.value.filter((savedRamble) => !loadedIds.includes(savedRamble.id))
        loadedSavedRambleIds.value = []
        await refreshSavedRambleCount()
        return true
      }
    } finally {
      if (session === sessionId.value) isDeletingLoadedSavedRambles.value = false
    }
    return false
  }

  const deleteSavedRamble = async (ramble) => {
    if (!(await UIUtils.showDeleteConfirmation(t('transaction.assistant_ramble_delete_confirm_title'), t('transaction.assistant_ramble_delete_one_confirm_message')))) return
    const response = await assistantRepository.deleteSavedRamble(ramble.id)
    if (!isResponseSuccessful(response)) return
    savedRambles.value = savedRambles.value.filter((savedRamble) => savedRamble.id !== ramble.id)
    loadedSavedRambleIds.value = loadedSavedRambleIds.value.filter((id) => id !== ramble.id)
    await refreshSavedRambleCount()
  }

  const reset = () => {
    sessionId.value += 1
    rambleText.value = ''
    savedRambles.value = []
    loadedSavedRambleIds.value = []
    rambleTransactions.value = []
    isLoadingSavedRambles.value = false
    isDeletingLoadedSavedRambles.value = false
    isInterpreting.value = false
    isCreatingRambleTransactions.value = false
    hasInterpreted.value = false
    rambleError.value = ''
    currentCreateIndex.value = 0
  }

  const interpretationText = () =>
    [
      rambleText.value.trim(),
      savedRambles.value
        .map((ramble) => ramble.text?.trim())
        .filter(Boolean)
        .join('\n'),
    ]
      .filter(Boolean)
      .join('\n')

  const interpretRambleText = async () => {
    if (!interpretationText()) return

    const session = sessionId.value
    isInterpreting.value = true
    hasInterpreted.value = false
    rambleError.value = ''

    try {
      const response = await assistantRepository.interpretTransactions({
        text: rambleText.value.trim(),
        savedRambles: savedRambles.value.map((ramble) => ({ text: ramble.text, createdAt: ramble.created_at })),
        now: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: profileStore.language,
        externalContext: profileStore.assistantLlmContext,
        context: getRambleContext(),
      })
      if (session !== sessionId.value) return

      const drafts = []
      for (const transaction of (response.transactions ?? []).map(resolveRambleTransaction)) {
        if (session !== sessionId.value) return
        drafts.push({ id: transaction.id, assistant: transaction, item: await buildTransactionItemFromAssistant(transaction), status: rambleStatus.pending, error: null, response: null })
      }

      rambleTransactions.value = drafts
      hasInterpreted.value = true
    } catch (error) {
      if (session !== sessionId.value) return
      rambleTransactions.value = []
      rambleError.value = getRambleErrorMessage(error)
      hasInterpreted.value = true
    } finally {
      if (session === sessionId.value) isInterpreting.value = false
    }
  }

  const removeRambleTransaction = (transaction) => (rambleTransactions.value = rambleTransactions.value.filter((item) => item.id !== transaction.id))

  const updateRambleTransaction = (edited) => {
    const index = rambleTransactions.value.findIndex((transaction) => transaction.id === edited.id)
    if (index < 0) return
    const existing = rambleTransactions.value[index]
    const isCreated = existing.status === rambleStatus.success
    rambleTransactions.value[index] = { ...existing, item: cloneDeep(edited.item), status: isCreated ? rambleStatus.success : rambleStatus.pending, error: isCreated ? existing.error : null }
  }

  const createRambleTransactions = async () => {
    const session = sessionId.value
    const toCreate = rambleTransactions.value.filter((transaction) => transaction.status !== rambleStatus.success)
    if (toCreate.length === 0) return

    isCreatingRambleTransactions.value = true
    rambleError.value = ''
    let successCount = 0

    try {
      for (const transaction of toCreate) {
        if (session !== sessionId.value) return
        const index = rambleTransactions.value.findIndex((item) => item.id === transaction.id)
        if (index < 0) continue

        const draft = rambleTransactions.value[index]
        currentCreateIndex.value = index + 1
        draft.status = rambleStatus.creating
        draft.error = null

        try {
          const response = await transactionRepository.insert(TransactionTransformer.transformToApi(cloneDeep(draft.item)))
          if (session !== sessionId.value) return
          if (isResponseSuccessful(response)) {
            draft.status = rambleStatus.success
            draft.response = response
            successCount += 1
            continue
          }
          draft.status = rambleStatus.error
          draft.error = getCreateErrorMessage(response)
        } catch (error) {
          if (session !== sessionId.value) return
          draft.status = rambleStatus.error
          draft.error = getCreateErrorMessage(error)
        }
      }

      if (successCount > 0) UIUtils.showToastSuccess(t('transaction.assistant_ramble_created_toast', successCount))
      if (failedCount.value > 0) return

      if (hasLoadedSavedRambles.value && !(await deleteLoadedSavedRambles({ confirm: false }))) {
        rambleError.value = 'Transactions were created, but saved rambles could not be deleted.'
        return
      }

      await onCreated?.()
    } finally {
      if (session === sessionId.value) {
        currentCreateIndex.value = 0
        isCreatingRambleTransactions.value = false
      }
    }
  }

  return {
    rambleText,
    savedRambles,
    savedRamblesCount,
    isLoadingSavedRambles,
    isDeletingLoadedSavedRambles,
    rambleTransactions,
    isInterpreting,
    isCreatingRambleTransactions,
    hasInterpreted,
    rambleError,
    createButtonCount,
    hasCreateProgress,
    createProgressPercentage,
    createProgressLabel,
    createButtonLabel,
    refreshSavedRambleCount,
    fetchSavedRambles,
    deleteLoadedSavedRambles,
    deleteSavedRamble,
    reset,
    interpretRambleText,
    removeRambleTransaction,
    updateRambleTransaction,
    createRambleTransactions,
  }
}
