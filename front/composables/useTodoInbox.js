import { cloneDeep, get, isEqual } from 'lodash-es'
import { computed, reactive, ref } from 'vue'
import Tag from '~/models/Tag.js'
import TagRepository from '~/repository/TagRepository.js'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import ResponseUtils from '~/utils/ResponseUtils.js'
import UIUtils from '~/utils/UIUtils.js'
import {
  TODO_BATCH_CONCURRENCY,
  TODO_PAGE_SIZE,
  buildTodoRemovalRequest,
  buildTodoRestoreRequest,
  getActiveTodoItems,
  getDefaultTodoDateRange,
  getTodoDateWindows,
  hasTodoMarker,
  hasTodoMarkerOnJournals,
  runWithConcurrency,
} from '~/utils/TodoTransactionUtils.js'

export function useTodoInbox() {
  const tagStore = useTagStore()
  const { t } = useI18n()
  const tagRepository = new TagRepository()
  const transactionRepository = new TransactionRepository()

  const items = ref([])
  const receipts = ref([])
  const expandedIds = ref(new Set())
  const expandableIds = ref(new Set())
  const seenIds = ref(new Set())
  const dateRange = ref(getDefaultTodoDateRange())
  const isFinished = ref(false)
  const isRefreshing = ref(false)
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const loadError = ref(null)
  const isBatchRunning = ref(false)
  const isConfirmingBatch = ref(false)
  const batchProgress = ref(null)
  const batchResult = ref(null)
  const itemState = reactive({})
  const editorOpen = ref(false)
  const editorItem = ref(null)
  const editorSaving = ref(false)
  const editorLoading = ref(false)
  const editorError = ref(null)
  const editorUnconfirmed = ref(false)
  let editorOriginal = null
  let failedLoad = null

  const markerName = computed(() => Tag.getDisplayName(tagStore.tagTodo))
  const hasMarkerConfiguration = computed(() => Boolean(markerName.value))
  const receiptById = computed(() => Object.fromEntries(receipts.value.map((receipt) => [String(receipt.id), receipt])))
  const activeItems = computed(() => getActiveTodoItems(items.value, receipts.value))
  const remainingCount = computed(() => activeItems.value.length)
  const expandableItems = computed(() => activeItems.value.filter((item) => expandableIds.value.has(String(item.id)) && !getState(item.id).isProcessing && !getState(item.id).isQueued))
  const hasExpandableItems = computed(() => expandableItems.value.length > 0)
  const allExpanded = computed(() => hasExpandableItems.value && expandableItems.value.every((item) => expandedIds.value.has(String(item.id))))
  const setExpandable = (item, canExpand) => {
    const next = new Set(expandableIds.value)
    canExpand ? next.add(String(item.id)) : next.delete(String(item.id))
    expandableIds.value = next
  }
  const toggleAllExpanded = () => {
    expandedIds.value = allExpanded.value ? new Set() : new Set(expandableItems.value.map((item) => String(item.id)))
  }
  const isAnyItemProcessing = computed(() => Object.values(itemState).some((state) => state.isProcessing || state.isQueued))
  const isListLocked = computed(() => isBatchRunning.value || isConfirmingBatch.value || isAnyItemProcessing.value || editorOpen.value)

  const getState = (id) => itemState[String(id)] ?? { isProcessing: false, isQueued: false, error: null }

  const setState = (id, values) => {
    const key = String(id)
    itemState[key] = { ...getState(key), ...values }
  }

  const clearState = () => {
    Object.keys(itemState).forEach((id) => delete itemState[id])
  }

  const getResponseError = (response, fallbackKey) => get(response, 'data.message') ?? get(response, 'data.errors.0.detail') ?? t(fallbackKey)
  const getResponseTransaction = (response) => get(response, 'data.data')

  const transformTransaction = (transaction) => TransactionTransformer.transformFromApi(cloneDeep(transaction))

  const fetchMore = async (range, knownIds) => {
    const windows = getTodoDateWindows(range)
    const candidates = []
    let finished = false
    // TODO membership changes after Done and Undo. Rescan IDs rather than advancing a stale offset.
    for (const [windowIndex, window] of windows.entries()) {
      let requestedPage = 1
      let lastPage = 1
      do {
        const response = await tagRepository.getTodoTransactions(tagStore.tagTodo, { page: requestedPage, pageSize: TODO_PAGE_SIZE, ...window, showLoading: false })
        if (!ResponseUtils.isSuccess(response)) throw new Error(getResponseError(response, 'todo_inbox.load_error'))
        const rows = get(response, 'data.data', [])
        lastPage = Math.max(1, Number(get(response, 'data.meta.pagination.total_pages', 1)) || 1)
        const unseen = rows.filter((item) => !knownIds.has(String(item.id)))
        const available = TODO_PAGE_SIZE - candidates.length
        for (const item of unseen.slice(0, available)) {
          if (knownIds.has(String(item.id))) continue
          knownIds.add(String(item.id))
          candidates.push(item)
        }
        finished = windowIndex === windows.length - 1 && requestedPage >= lastPage && unseen.length <= available
        if (candidates.length >= TODO_PAGE_SIZE) break
        requestedPage += 1
      } while (requestedPage <= lastPage)
      if (candidates.length >= TODO_PAGE_SIZE) break
    }
    // Only new groups need detail reads; the tag endpoint can omit their unmarked splits.
    const results = await runWithConcurrency(candidates, TODO_BATCH_CONCURRENCY, async (item) => {
      const detail = await transactionRepository.getTodoTransaction(item.id)
      if (get(detail, 'status') === 404) return null
      if (!ResponseUtils.isSuccess(detail) || !getResponseTransaction(detail)) throw new Error(getResponseError(detail, 'todo_inbox.load_error'))
      const transaction = getResponseTransaction(detail)
      return hasTodoMarker(transaction, markerName.value) ? transaction : null
    })
    const failure = results.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
    return { items: TransactionTransformer.transformFromApiList(cloneDeep(results.map((result) => result.value).filter(Boolean))), finished, seenIds: knownIds }
  }

  const loadMore = async ({ refresh = false, range = dateRange.value } = {}) => {
    if (!hasMarkerConfiguration.value || isLoading.value || isListLocked.value) return false
    isLoading.value = true
    loadError.value = null
    try {
      const result = await fetchMore(range, new Set(refresh ? [] : seenIds.value))
      if (refresh) {
        items.value = result.items
        dateRange.value = { ...range }
        expandedIds.value = new Set()
        expandableIds.value = new Set(result.items.map((item) => String(item.id)).filter((id) => expandableIds.value.has(id)))
        clearState()
        receipts.value = []
        batchProgress.value = null
        batchResult.value = null
      } else {
        items.value = [...items.value, ...result.items]
      }
      isFinished.value = result.finished
      seenIds.value = result.seenIds
      isLoaded.value = true
      failedLoad = null
      return true
    } catch (error) {
      failedLoad = { refresh, range: { ...range } }
      loadError.value = error instanceof RangeError ? t('todo_inbox.invalid_dates') : error.message || t('todo_inbox.load_error')
      isLoaded.value = true
      return false
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }
  const retryLoad = () => loadMore(failedLoad ?? {})
  const refreshList = async (range = dateRange.value) => {
    const result = await loadMore({ refresh: true, range })
    isRefreshing.value = false
    return result
  }

  const removeStaleItem = (item, messageKey) => {
    addReceipt(item, [], messageKey)
    UIUtils.showToastSuccess(t(messageKey))
  }

  const addReceipt = (item, journalIds, messageKey = 'todo_inbox.done') => {
    const receipt = {
      id: String(item.id),
      item,
      journalIds,
      markerName: markerName.value,
      messageKey,
    }
    receipts.value = [...receipts.value.filter((currentReceipt) => String(currentReceipt.id) !== String(item.id)), receipt]
    setState(item.id, { pendingJournalIds: null })
  }

  const doneItem = async (item) => {
    const id = String(item.id)
    if (isLoading.value || getState(id).isProcessing || receiptById.value[id]) {
      return { status: 'ignored' }
    }

    setState(id, { isProcessing: true, isQueued: false, error: null })
    try {
      const latestResponse = await transactionRepository.getTodoTransaction(id)
      if (get(latestResponse, 'status') === 404) {
        removeStaleItem(item, 'todo_inbox.transaction_deleted')
        return { status: 'stale' }
      }
      if (!ResponseUtils.isSuccess(latestResponse)) {
        throw new Error(getResponseError(latestResponse, 'todo_inbox.item_error'))
      }

      const latestTransaction = getResponseTransaction(latestResponse)
      if (!hasTodoMarker(latestTransaction, markerName.value)) {
        if (getState(id).pendingJournalIds?.length) {
          addReceipt(item, getState(id).pendingJournalIds)
        } else {
          removeStaleItem(item, 'todo_inbox.completed_elsewhere')
        }
        return { status: 'stale' }
      }

      const { journalIds, requestData } = buildTodoRemovalRequest(latestTransaction, markerName.value)
      setState(id, { pendingJournalIds: journalIds })
      const updateResponse = await transactionRepository.updateTodoTransaction(id, requestData)
      let updatedTransaction = getResponseTransaction(updateResponse)
      if (!ResponseUtils.isSuccess(updateResponse)) {
        if (!updateResponse?.status || updateResponse.status >= 500) {
          const verification = await transactionRepository.getTodoTransaction(id)
          updatedTransaction = getResponseTransaction(verification)
          if (!ResponseUtils.isSuccess(verification) || !updatedTransaction || hasTodoMarker(updatedTransaction, markerName.value)) {
            throw new Error(t('todo_inbox.completion_unconfirmed'))
          }
        } else {
          setState(id, { pendingJournalIds: null })
          throw new Error(getResponseError(updateResponse, 'todo_inbox.item_error'))
        }
      }

      if (!updatedTransaction || hasTodoMarker(updatedTransaction, markerName.value)) {
        throw new Error(t('todo_inbox.marker_still_present'))
      }

      addReceipt(item, journalIds)
      return { status: 'completed' }
    } catch (error) {
      setState(id, { error: error.message || t('todo_inbox.item_error') })
      throw error
    } finally {
      setState(id, { isProcessing: false })
    }
  }

  const undoItem = async (item) => {
    const id = String(item.id)
    const receipt = receiptById.value[id]
    if (isLoading.value || !receipt || getState(id).isProcessing) {
      return false
    }

    setState(id, { isProcessing: true, error: null })
    try {
      const latestResponse = await transactionRepository.getTodoTransaction(id)
      if (!ResponseUtils.isSuccess(latestResponse)) {
        throw new Error(getResponseError(latestResponse, 'todo_inbox.item_error'))
      }

      const latestTransaction = getResponseTransaction(latestResponse)
      const restoration = buildTodoRestoreRequest(latestTransaction, receipt.markerName, receipt.journalIds)
      if (restoration.restoredJournalIds.length === 0) {
        throw new Error(t('todo_inbox.undo_missing_splits'))
      }

      let restoredTransaction = latestTransaction
      if (!restoration.isAlreadyRestored) {
        const updateResponse = await transactionRepository.updateTodoTransaction(id, restoration.requestData)
        if (!ResponseUtils.isSuccess(updateResponse)) {
          throw new Error(getResponseError(updateResponse, 'todo_inbox.item_error'))
        }
        restoredTransaction = getResponseTransaction(updateResponse)
      }

      if (!restoredTransaction || !hasTodoMarkerOnJournals(restoredTransaction, receipt.markerName, restoration.restoredJournalIds)) {
        throw new Error(t('todo_inbox.marker_missing'))
      }

      const index = items.value.findIndex((currentItem) => String(currentItem.id) === id)
      if (index >= 0) {
        items.value[index] = transformTransaction(restoredTransaction)
      }
      receipts.value = receipts.value.filter((currentReceipt) => String(currentReceipt.id) !== id)
      if (restoration.missingJournalIds.length > 0) {
        UIUtils.showToastError(t('todo_inbox.undo_partial', { count: restoration.missingJournalIds.length }))
      }
      return true
    } catch (error) {
      setState(id, { error: error.message || t('todo_inbox.item_error') })
      throw error
    } finally {
      setState(id, { isProcessing: false })
    }
  }

  const markLoadedDone = async () => {
    const targets = [...activeItems.value]
    if (isLoading.value || targets.length === 0 || isListLocked.value) {
      return false
    }

    isConfirmingBatch.value = true
    let confirmed
    try {
      confirmed = await UIUtils.showConfirmation(t('todo_inbox.confirm_title'), t('todo_inbox.confirm_message', { count: targets.length, marker: markerName.value }))
    } finally {
      isConfirmingBatch.value = false
    }
    if (!confirmed || isLoading.value || isListLocked.value) {
      return false
    }

    isBatchRunning.value = true
    targets.forEach((item) => setState(item.id, { isQueued: true, error: null }))
    batchResult.value = null
    batchProgress.value = { processed: 0, total: targets.length, successful: 0, failed: 0 }
    try {
      const results = await runWithConcurrency(targets, TODO_BATCH_CONCURRENCY, doneItem, ({ processed, total, result }) => {
        batchProgress.value = {
          processed,
          total,
          successful: batchProgress.value.successful + (result.status === 'fulfilled' ? 1 : 0),
          failed: batchProgress.value.failed + (result.status === 'rejected' ? 1 : 0),
        }
      })
      const failed = results.filter((result) => result.status === 'rejected').length
      batchResult.value = { successful: results.length - failed, failed, total: results.length }
      batchProgress.value = null
      return failed === 0
    } finally {
      isBatchRunning.value = false
    }
  }

  const toggleExpanded = (item) => {
    const id = String(item.id)
    const next = new Set(expandedIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    expandedIds.value = next
  }

  const applyEditorResult = (item, rawTransaction) => {
    const updatedItem = transformTransaction(rawTransaction)
    const index = items.value.findIndex((current) => String(current.id) === String(item.id))
    if (index >= 0) items.value.splice(index, 1, updatedItem)
    if (!hasTodoMarker(rawTransaction, markerName.value)) {
      addReceipt(updatedItem, [], 'todo_inbox.done')
    } else if (rawTransaction.attributes.transactions.every((split) => split.date && (split.date.slice(0, 10) < dateRange.value.start || split.date.slice(0, 10) > dateRange.value.end))) {
      addReceipt(updatedItem, [], 'todo_inbox.outside_dates')
    }
  }

  const openEditor = async (item) => {
    if (
      isLoading.value ||
      isConfirmingBatch.value ||
      isBatchRunning.value ||
      getState(item.id).isProcessing ||
      getState(item.id).isQueued ||
      receiptById.value[String(item.id)] ||
      editorLoading.value ||
      editorOpen.value
    )
      return false
    editorLoading.value = true
    editorError.value = null
    editorOpen.value = true
    try {
      const response = await transactionRepository.getTodoTransaction(item.id)
      if (!ResponseUtils.isSuccess(response) || !getResponseTransaction(response)) throw new Error(getResponseError(response, 'todo_inbox.item_error'))
      editorOriginal = cloneDeep(getResponseTransaction(response))
      if (!hasTodoMarker(editorOriginal, markerName.value)) {
        removeStaleItem(item, 'todo_inbox.completed_elsewhere')
        editorOpen.value = false
        return false
      }
      editorItem.value = transformTransaction(editorOriginal)
      editorUnconfirmed.value = false
      return true
    } catch (error) {
      setState(item.id, { error: error.message || t('todo_inbox.item_error') })
      editorOpen.value = false
      return false
    } finally {
      editorLoading.value = false
    }
  }

  const saveEditor = async () => {
    if (!editorOpen.value || !editorItem.value || editorSaving.value || editorUnconfirmed.value) return false
    editorSaving.value = true
    editorError.value = null
    const item = editorItem.value
    let sentWrite = false
    try {
      const latest = await transactionRepository.getTodoTransaction(item.id)
      if (!ResponseUtils.isSuccess(latest) || !getResponseTransaction(latest)) throw new Error(getResponseError(latest, 'todo_inbox.item_error'))
      if (!isEqual(getResponseTransaction(latest), editorOriginal)) {
        editorError.value = t('todo_inbox.editor_changed')
        return false
      }
      const requestData = TransactionTransformer.transformToApi(item)
      sentWrite = true
      const response = await transactionRepository.updateTodoTransaction(item.id, requestData)
      if (!ResponseUtils.isSuccess(response)) {
        if (!response?.status || response.status >= 500) {
          editorUnconfirmed.value = true
          editorError.value = t('todo_inbox.editor_unconfirmed')
        } else {
          editorError.value = getResponseError(response, 'todo_inbox.item_error')
        }
        return false
      }
      const saved = getResponseTransaction(response)
      if (!saved) {
        editorUnconfirmed.value = true
        editorError.value = t('todo_inbox.editor_unconfirmed')
        return false
      }
      applyEditorResult(item, saved)
      editorOpen.value = false
      editorItem.value = null
      editorOriginal = null
      return true
    } catch (error) {
      if (sentWrite) editorUnconfirmed.value = true
      editorError.value = sentWrite ? t('todo_inbox.editor_unconfirmed') : error.message || t('todo_inbox.item_error')
      return false
    } finally {
      editorSaving.value = false
    }
  }

  const closeEditor = async () => {
    if (editorSaving.value || editorLoading.value) return false
    if (editorUnconfirmed.value && editorItem.value) {
      const latest = await transactionRepository.getTodoTransaction(editorItem.value.id)
      if (!ResponseUtils.isSuccess(latest) || !getResponseTransaction(latest)) {
        editorError.value = t('todo_inbox.editor_unconfirmed')
        return false
      }
      applyEditorResult(editorItem.value, getResponseTransaction(latest))
    }
    editorOpen.value = false
    editorItem.value = null
    editorOriginal = null
    editorUnconfirmed.value = false
    editorError.value = null
    return true
  }

  return {
    items,
    receipts,
    receiptById,
    activeItems,
    remainingCount,
    markerName,
    hasMarkerConfiguration,
    expandedIds,
    hasExpandableItems,
    allExpanded,
    setExpandable,
    toggleAllExpanded,
    dateRange,
    isFinished,
    isRefreshing,
    isLoading,
    isLoaded,
    loadError,
    isListLocked,
    isAnyItemProcessing,
    isBatchRunning,
    batchProgress,
    batchResult,
    getState,
    loadMore,
    retryLoad,
    refreshList,
    editorOpen,
    editorItem,
    editorSaving,
    editorLoading,
    editorError,
    editorUnconfirmed,
    openEditor,
    saveEditor,
    closeEditor,
    toggleExpanded,
    doneItem,
    undoItem,
    markLoadedDone,
  }
}
