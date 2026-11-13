import { cloneDeep, get } from 'lodash-es'
import AssistantRepository from '~/core/repository/AssistantRepository'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import { useRambleTransactionResolver } from '~/core/composables/useRambleTransactionResolver'
import { invalidateAssistantHistory, withAssistantHistory } from '~/core/composables/useAssistantHistory'
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

// Dictate transactions: saved rambles (typed or recorded, newest first) → interpret the picked ones plus the composer text → drafts → create.
// Once every draft is created, the interpreted rambles are deleted; the others stay saved for later.
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
  const savedRamblesCount = ref(0)
  const isLoadingSavedRambles = ref(false)
  const isAddingRamble = ref(false)
  const pickedRambleIds = ref([])
  const interpretedRambleIds = ref([])
  const rambleTransactions = ref([])
  const isInterpreting = ref(false)
  const isCreatingRambleTransactions = ref(false)
  const hasInterpreted = ref(false)
  const rambleError = ref('')
  const currentCreateIndex = ref(0)
  const sessionId = ref(0)

  const pickedRambles = computed(() => savedRambles.value.filter((ramble) => pickedRambleIds.value.includes(ramble.id)))
  const isAllPicked = computed(() => savedRambles.value.length > 0 && pickedRambles.value.length === savedRambles.value.length)
  const countByStatus = (status) => rambleTransactions.value.filter((transaction) => transaction.status === status).length
  const createdTransactions = computed(() => rambleTransactions.value.filter((transaction) => transaction.status === rambleStatus.success))
  const createdCount = computed(() => createdTransactions.value.length)
  const failedCount = computed(() => countByStatus(rambleStatus.error))
  const createQueue = computed(() => rambleTransactions.value.filter((transaction) => transaction.status !== rambleStatus.success && transaction.isIncluded))
  const createButtonCount = computed(() => createQueue.value.length)
  const processedCount = computed(() => createdCount.value + failedCount.value)
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

  const setSavedRambles = (list) => {
    savedRambles.value = list
    savedRamblesCount.value = list.length
    pickedRambleIds.value = pickedRambleIds.value.filter((id) => list.some((ramble) => ramble.id === id))
  }

  const refreshSavedRambleCount = async ({ showLoading = false } = {}) => {
    if (!appStore.llmIsConfigured) return
    const response = await assistantRepository.getSavedRambleCount({ showLoading })
    savedRamblesCount.value = response.count ?? savedRambles.value.length
  }

  // Every saved ramble starts picked
  const fetchSavedRambles = async () => {
    const session = sessionId.value
    isLoadingSavedRambles.value = true
    try {
      const response = await assistantRepository.getSavedRambles()
      if (session !== sessionId.value) return
      setSavedRambles([...(response.data ?? [])].reverse())
      pickedRambleIds.value = savedRambles.value.map((ramble) => ramble.id)
    } finally {
      if (session === sessionId.value) isLoadingSavedRambles.value = false
    }
  }

  // The composer text becomes a saved ramble (picked)
  const addRamble = async () => {
    const text = rambleText.value.trim()
    if (!text || isAddingRamble.value) return
    isAddingRamble.value = true
    try {
      const response = await assistantRepository.createSavedRamble(text)
      if (!isResponseSuccessful(response)) return
      const ramble = get(response, 'data.data')
      setSavedRambles([ramble, ...savedRambles.value])
      pickedRambleIds.value = [...pickedRambleIds.value, ramble.id]
      rambleText.value = ''
      UIUtils.showToastSuccess(t('transaction.assistant_ramble_added'))
    } finally {
      isAddingRamble.value = false
    }
  }

  const updateSavedRamble = async (ramble, text) => {
    text = text.trim()
    if (!text || text === ramble.text) return true
    const response = await assistantRepository.updateSavedRamble(ramble.id, text)
    if (!isResponseSuccessful(response)) return false
    setSavedRambles(savedRambles.value.map((item) => (item.id === ramble.id ? { ...item, ...get(response, 'data.data'), is_edited: true } : item)))
    return true
  }

  const deleteSavedRamble = async (ramble) => {
    if (!(await UIUtils.showDeleteConfirmation(t('transaction.assistant_ramble_delete_confirm_title'), t('transaction.assistant_ramble_delete_one_confirm_message')))) return
    const response = await assistantRepository.deleteSavedRamble(ramble.id)
    if (isResponseSuccessful(response)) setSavedRambles(savedRambles.value.filter((item) => item.id !== ramble.id))
  }

  const deleteSavedRambles = async (ids) => {
    if (ids.length === 0) return true
    const response = await assistantRepository.deleteSavedRambles(ids)
    if (!isResponseSuccessful(response)) return false
    setSavedRambles(savedRambles.value.filter((ramble) => !ids.includes(ramble.id)))
    return true
  }

  const deleteAllSavedRambles = async () => {
    if (!(await UIUtils.showDeleteConfirmation(t('transaction.assistant_ramble_delete_confirm_title'), t('transaction.assistant_ramble_delete_confirm_message')))) return
    await deleteSavedRambles(savedRambles.value.map((ramble) => ramble.id))
  }

  const togglePickedRamble = (ramble) =>
    (pickedRambleIds.value = pickedRambleIds.value.includes(ramble.id) ? pickedRambleIds.value.filter((id) => id !== ramble.id) : [...pickedRambleIds.value, ramble.id])
  const toggleAllPickedRambles = () => (pickedRambleIds.value = isAllPicked.value ? [] : savedRambles.value.map((ramble) => ramble.id))

  const resetDrafts = () => {
    rambleTransactions.value = []
    interpretedRambleIds.value = []
    hasInterpreted.value = false
    rambleError.value = ''
  }

  const reset = () => {
    sessionId.value += 1
    rambleText.value = ''
    setSavedRambles([])
    resetDrafts()
    isLoadingSavedRambles.value = false
    isInterpreting.value = false
    isCreatingRambleTransactions.value = false
    currentCreateIndex.value = 0
  }

  // The picked saved rambles plus the composer text. Resolves true when the assistant answered.
  const interpretRambleText = async ({ rambles = pickedRambles.value } = {}) => {
    const text = rambleText.value.trim()
    if (!text && rambles.length === 0) return false

    const session = sessionId.value
    isInterpreting.value = true
    rambleError.value = ''

    try {
      const response = await assistantRepository.interpretTransactions({
        text,
        savedRambles: rambles.map((ramble) => ({ text: ramble.text, createdAt: ramble.created_at })),
        now: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: profileStore.language,
        externalContext: profileStore.assistantLlmContext,
        // The entity lists plus, when enabled, the user's recent transactions as examples
        context: await withAssistantHistory(getRambleContext(), profileStore.assistantHistoryCount),
      })
      if (session !== sessionId.value) return false

      const drafts = []
      for (const transaction of (response.transactions ?? []).map(resolveRambleTransaction)) {
        if (session !== sessionId.value) return false
        const item = await buildTransactionItemFromAssistant(transaction)
        drafts.push({ id: transaction.id, assistant: transaction, item, status: rambleStatus.pending, isIncluded: true, error: null, response: null })
      }

      rambleTransactions.value = drafts
      interpretedRambleIds.value = rambles.map((ramble) => ramble.id)
      hasInterpreted.value = true
      return true
    } catch (error) {
      if (session !== sessionId.value) return false
      resetDrafts()
      rambleError.value = getRambleErrorMessage(error)
      hasInterpreted.value = true
      return false
    } finally {
      if (session === sessionId.value) isInterpreting.value = false
    }
  }

  const removeRambleTransaction = (transaction) => (rambleTransactions.value = rambleTransactions.value.filter((item) => item.id !== transaction.id))
  const toggleRambleTransaction = (transaction) => (transaction.isIncluded = !transaction.isIncluded)

  const updateRambleTransaction = (edited) => {
    const index = rambleTransactions.value.findIndex((transaction) => transaction.id === edited.id)
    if (index < 0) return
    const existing = rambleTransactions.value[index]
    const isCreated = existing.status === rambleStatus.success
    rambleTransactions.value[index] = { ...existing, item: cloneDeep(edited.item), status: isCreated ? rambleStatus.success : rambleStatus.pending, error: isCreated ? existing.error : null }
  }

  const createRambleTransactions = async () => {
    const session = sessionId.value
    const toCreate = [...createQueue.value]
    if (toCreate.length === 0) return

    isCreatingRambleTransactions.value = true
    rambleError.value = ''
    let successCount = 0

    try {
      for (const draft of toCreate) {
        if (session !== sessionId.value) return
        currentCreateIndex.value = rambleTransactions.value.indexOf(draft) + 1
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

      if (successCount > 0) {
        invalidateAssistantHistory()
        UIUtils.showToastSuccess(t('transaction.assistant_ramble_created_toast', successCount))
      }
      if (failedCount.value > 0) return

      if (!(await deleteSavedRambles(interpretedRambleIds.value))) {
        rambleError.value = 'Transactions were created, but saved rambles could not be deleted.'
        return
      }
      interpretedRambleIds.value = []
      rambleText.value = ''
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
    isAddingRamble,
    pickedRambleIds,
    pickedRambles,
    isAllPicked,
    rambleTransactions,
    createdTransactions,
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
    addRamble,
    updateSavedRamble,
    deleteSavedRamble,
    deleteAllSavedRambles,
    togglePickedRamble,
    toggleAllPickedRambles,
    reset,
    resetDrafts,
    interpretRambleText,
    removeRambleTransaction,
    toggleRambleTransaction,
    updateRambleTransaction,
    createRambleTransactions,
  }
}
