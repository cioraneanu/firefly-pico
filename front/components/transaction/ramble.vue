<template>
  <van-badge v-if="appStore.llmIsConfigured" :content="savedRamblesCount" :show-zero="false" max="99">
    <van-button size="small" class="cursor-pointer" @click="openRamblePopup">
      <app-icon :icon="TablerIconConstants.ramble" :size="18" />
    </van-button>
  </van-badge>

  <app-popup v-model:show="showRamblePopup" :popup-style="ramblePopupStyle">
    <div class="display-flex flex-direction-column h-100 m-h-0 position-relative" :aria-busy="isInterpreting">
      <div class="display-flex flex-direction-column h-100 m-h-0" :class="{ 'pointer-events-none': isRambleFormDisabled }" :inert="isRambleFormDisabled">
        <div class="ramble-header flex-center-vertical gap-2">
          <div class="ramble-header-icon flex-center">
            <app-icon :icon="TablerIconConstants.ramble" :size="22" :stroke="1.6" />
          </div>
          <div class="flex-1-w">
            <div class="font-700 text-size-16 line-height-normal">{{ $t('transaction.assistant_ramble_title') }}</div>
            <div class="text-size-12 text-muted mt-1">
              {{ savedRamblesCount > 0 ? $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) : $t('transaction.assistant_ramble_input_hint') }}
            </div>
          </div>
          <van-button round size="small" class="cursor-pointer ramble-icon-button" @click="closeRamblePopup">
            <app-icon :icon="TablerIconConstants.close" :size="18" />
          </van-button>
        </div>

        <div class="flex-1 m-h-0 overflow-auto display-flex flex-direction-column gap-3 p-3 ramble-body">
          <ramble-input-card
            ref="inputCardRef"
            v-model="rambleText"
            :saved-rambles="savedRambles"
            :saved-rambles-count="savedRamblesCount"
            :is-loading-saved="isLoadingSavedRambles"
            :is-deleting-saved="isDeletingLoadedSavedRambles"
            :is-interpreting="isInterpreting"
            :is-disabled="isRambleFormDisabled"
            @interpret="interpretRambleText"
            @load-saved="fetchSavedRambles"
            @delete-saved="deleteLoadedSavedRambles"
          />

          <div v-if="rambleError" class="ramble-error text-size-12">{{ rambleError }}</div>

          <template v-if="rambleTransactions.length > 0">
            <div class="flex-center-vertical gap-2 px-1">
              <div class="ramble-section-label">{{ $t('transaction.assistant_ramble_preview') }}</div>
              <div class="ramble-count-pill">{{ rambleTransactions.length }}</div>
            </div>
            <van-cell-group inset class="no-margin overflow-hidden">
              <ramble-transaction-item
                v-for="(transaction, index) in rambleTransactions"
                :key="transaction.id"
                v-model="rambleTransactions[index]"
                @delete="removeRambleTransaction"
                @edit="openRambleTransaction"
              />
            </van-cell-group>
          </template>

          <div v-else class="ramble-empty flex-1 flex-center flex-direction-column gap-2 text-center">
            <div class="ramble-empty-icon flex-center">
              <app-icon :icon="TablerIconConstants.ramble" :size="26" :stroke="1.4" />
            </div>
            <div class="text-size-13 text-muted">
              {{ hasInterpreted ? $t('transaction.assistant_ramble_no_results') : $t('transaction.assistant_ramble_no_transactions_yet') }}
            </div>
          </div>
        </div>

        <div v-if="hasCreateProgress || rambleTransactions.length > 0" class="p-3 ramble-footer">
          <div v-if="hasCreateProgress" class="mb-3">
            <div class="flex-center-vertical gap-2 text-size-12 text-muted mb-2">
              <van-loading v-if="isCreatingRambleTransactions" size="16" />
              <div>{{ createProgressLabel }}</div>
            </div>
            <van-progress :percentage="createProgressPercentage" />
          </div>

          <van-button block round type="primary" class="cursor-pointer" :loading="isCreatingRambleTransactions" :disabled="createButtonCount === 0" @click="createRambleTransactions">
            {{ createButtonLabel }}
          </van-button>
        </div>
      </div>

      <div v-if="isInterpreting" class="ramble-dialog-loading flex-center">
        <div class="ramble-dialog-loading-card flex-center flex-direction-column">
          <van-loading size="28" />
        </div>
      </div>
    </div>
  </app-popup>

  <ramble-transaction-edit-popup v-model:show="showRambleTransactionPopup" v-model="editingRambleTransaction" @save="onRambleTransactionEdited" />
</template>

<script setup>
import { cloneDeep } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AssistantRepository from '~/repository/AssistantRepository.js'
import RambleInputCard from '~/components/transaction/ramble/ramble-input-card.vue'
import RambleTransactionItem from '~/components/transaction/ramble/ramble-transaction-item.vue'
import RambleTransactionEditPopup from '~/components/transaction/ramble/ramble-transaction-edit-popup.vue'
import { useRambleTransactionResolver } from '~/composables/useRambleTransactionResolver.js'
import { useTransactionAssistantDraft } from '~/composables/useTransactionAssistantDraft.js'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import UIUtils from '~/utils/UIUtils.js'

const props = defineProps({
  assistantText: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const profileStore = useProfileStore()
const appStore = useAppStore()
const assistantRepository = new AssistantRepository()
const transactionRepository = new TransactionRepository()
const { getRambleContext, resolveRambleTransaction } = useRambleTransactionResolver()
const { buildTransactionItemFromAssistant } = useTransactionAssistantDraft()

const createStatus = {
  pending: 'pending',
  creating: 'creating',
  success: 'success',
  error: 'error',
}

const showRamblePopup = ref(false)
const showRambleTransactionPopup = ref(false)
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
const editingRambleTransaction = ref(null)
const inputCardRef = ref(null)
const rambleSessionId = ref(0)

const ramblePopupStyle = computed(() => {
  if (appStore.isDesktopLayout) {
    // Full-bleed content: the header / footer dividers should reach the popup edges.
    return { width: 'min(680px, 94vw)', height: '82vh', maxHeight: '82vh', padding: '0' }
  }

  return { height: '90%' }
})

const hasLoadedSavedRambles = computed(() => {
  return loadedSavedRambleIds.value.length > 0
})

const createdRambleTransactionsCount = computed(() => rambleTransactions.value.filter((transaction) => transaction.status === createStatus.success).length)
const failedRambleTransactionsCount = computed(() => rambleTransactions.value.filter((transaction) => transaction.status === createStatus.error).length)
const processedRambleTransactionsCount = computed(() => createdRambleTransactionsCount.value + failedRambleTransactionsCount.value)
const createButtonCount = computed(() => rambleTransactions.value.filter((transaction) => transaction.status !== createStatus.success).length)
const hasCreateProgress = computed(() => isCreatingRambleTransactions.value || processedRambleTransactionsCount.value > 0)
const isRambleFormDisabled = computed(() => isInterpreting.value)
const createProgressPercentage = computed(() => {
  if (rambleTransactions.value.length === 0) {
    return 0
  }

  return Math.round((processedRambleTransactionsCount.value / rambleTransactions.value.length) * 100)
})
const createProgressLabel = computed(() => {
  if (isCreatingRambleTransactions.value) {
    return t('transaction.assistant_ramble_progress_creating', {
      current: currentCreateIndex.value,
      total: rambleTransactions.value.length,
    })
  }

  if (failedRambleTransactionsCount.value > 0) {
    return t('transaction.assistant_ramble_progress_failed', {
      created: createdRambleTransactionsCount.value,
      total: rambleTransactions.value.length,
      failed: failedRambleTransactionsCount.value,
    })
  }

  return t('transaction.assistant_ramble_progress', {
    created: createdRambleTransactionsCount.value,
    total: rambleTransactions.value.length,
  })
})
const createButtonLabel = computed(() => {
  if (failedRambleTransactionsCount.value > 0) {
    return t('transaction.assistant_ramble_retry_failed', { count: createButtonCount.value })
  }

  return t('transaction.assistant_ramble_create', { count: createButtonCount.value })
})

const isResponseSuccessful = (response) => {
  return response?.status >= 200 && response?.status < 300
}

const refreshSavedRambleCount = async ({ showLoading = false } = {}) => {
  if (!appStore.llmIsConfigured) {
    return
  }
  const response = await assistantRepository.getSavedRambleCount({ showLoading })
  savedRamblesCount.value = response.count ?? savedRambles.value.length
}

const fetchSavedRambles = async () => {
  const sessionId = rambleSessionId.value
  isLoadingSavedRambles.value = true

  try {
    const response = await assistantRepository.getSavedRambles()
    if (sessionId !== rambleSessionId.value) {
      return
    }

    savedRambles.value = response.data ?? []
    loadedSavedRambleIds.value = savedRambles.value.map((ramble) => ramble.id).filter(Boolean)
    savedRamblesCount.value = savedRambles.value.length
  } finally {
    if (sessionId === rambleSessionId.value) {
      isLoadingSavedRambles.value = false
    }
  }
}

const deleteLoadedSavedRambles = async () => {
  const sessionId = rambleSessionId.value
  const loadedIds = [...loadedSavedRambleIds.value]
  if (loadedIds.length === 0) {
    return true
  }

  isDeletingLoadedSavedRambles.value = true

  try {
    const response = await assistantRepository.deleteSavedRambles(loadedIds)
    if (sessionId !== rambleSessionId.value) {
      return false
    }

    if (isResponseSuccessful(response)) {
      savedRambles.value = savedRambles.value.filter((savedRamble) => !loadedIds.includes(savedRamble.id))
      loadedSavedRambleIds.value = []
      await refreshSavedRambleCount({ showLoading: false })
      return true
    }
  } finally {
    if (sessionId === rambleSessionId.value) {
      isDeletingLoadedSavedRambles.value = false
    }
  }

  return false
}

const openRamblePopup = async () => {
  if (!rambleText.value && props.assistantText) {
    rambleText.value = props.assistantText
  }

  showRamblePopup.value = true
  await refreshSavedRambleCount({ showLoading: false })
}

const closeRamblePopup = () => {
  // The showRamblePopup watcher resets the ramble state on any close, overlay taps included.
  showRamblePopup.value = false
}

const resetRamble = () => {
  rambleSessionId.value += 1
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
  showRambleTransactionPopup.value = false
  editingRambleTransaction.value = null
}

const getRambleErrorMessage = (error) => {
  return error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.message ?? 'Assistant LLM request failed.'
}

const getTransactionCreateErrorMessage = (error) => {
  return (
    error?.data?.payload?.message ??
    error?.response?.data?.payload?.message ??
    error?.response?.data?.message ??
    error?.response?.data?.error?.message ??
    error?.data?.message ??
    error?.message ??
    'Failed to create transaction.'
  )
}

const getInterpretationText = () => {
  const savedRamblesText = savedRambles.value
    .map((ramble) => ramble.text?.trim())
    .filter(Boolean)
    .join('\n')

  return [rambleText.value.trim(), savedRamblesText].filter(Boolean).join('\n')
}

const interpretRambleText = async () => {
  const text = getInterpretationText()
  if (!text) {
    return
  }

  const sessionId = rambleSessionId.value
  isInterpreting.value = true
  hasInterpreted.value = false
  rambleError.value = ''

  try {
    const response = await assistantRepository.interpretTransactions({
      text,
      now: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: profileStore.language,
      context: getRambleContext(),
    })

    if (sessionId !== rambleSessionId.value) {
      return
    }

    const resolvedTransactions = (response.transactions ?? []).map(resolveRambleTransaction)
    const transactionDrafts = []
    for (const transaction of resolvedTransactions) {
      if (sessionId !== rambleSessionId.value) {
        return
      }

      transactionDrafts.push({
        id: transaction.id,
        assistant: transaction,
        item: await buildTransactionItemFromAssistant(transaction),
        status: createStatus.pending,
        error: null,
        response: null,
      })
    }

    rambleTransactions.value = transactionDrafts
    hasInterpreted.value = true
  } catch (error) {
    if (sessionId !== rambleSessionId.value) {
      return
    }

    rambleTransactions.value = []
    rambleError.value = getRambleErrorMessage(error)
    hasInterpreted.value = true
  } finally {
    if (sessionId === rambleSessionId.value) {
      isInterpreting.value = false
    }
  }
}

const removeRambleTransaction = (transaction) => {
  rambleTransactions.value = rambleTransactions.value.filter((rambleTransaction) => rambleTransaction.id !== transaction.id)
}

const openRambleTransaction = (transaction) => {
  if (transaction.status === createStatus.creating) {
    return
  }

  editingRambleTransaction.value = cloneDeep(transaction)
  showRambleTransactionPopup.value = true
}

const onRambleTransactionEdited = (editedTransaction) => {
  const index = rambleTransactions.value.findIndex((transaction) => transaction.id === editedTransaction.id)
  if (index >= 0) {
    const existingTransaction = rambleTransactions.value[index]
    rambleTransactions.value[index] = {
      ...existingTransaction,
      item: cloneDeep(editedTransaction.item),
      status: existingTransaction.status === createStatus.success ? createStatus.success : createStatus.pending,
      error: existingTransaction.status === createStatus.success ? existingTransaction.error : null,
    }
  }

  editingRambleTransaction.value = null
}

const createRambleTransactions = async () => {
  const sessionId = rambleSessionId.value
  const transactionsToCreate = rambleTransactions.value.filter((transaction) => transaction.status !== createStatus.success)
  if (transactionsToCreate.length === 0) {
    return
  }

  isCreatingRambleTransactions.value = true
  rambleError.value = ''
  let successCount = 0

  try {
    for (const transaction of transactionsToCreate) {
      if (sessionId !== rambleSessionId.value) {
        return
      }

      const transactionIndex = rambleTransactions.value.findIndex((rambleTransaction) => rambleTransaction.id === transaction.id)
      if (transactionIndex < 0) {
        continue
      }

      currentCreateIndex.value = transactionIndex + 1
      rambleTransactions.value[transactionIndex].status = createStatus.creating
      rambleTransactions.value[transactionIndex].error = null

      try {
        const requestData = TransactionTransformer.transformToApi(cloneDeep(rambleTransactions.value[transactionIndex].item))
        const response = await transactionRepository.insert(requestData)
        if (sessionId !== rambleSessionId.value) {
          return
        }

        if (isResponseSuccessful(response)) {
          rambleTransactions.value[transactionIndex].status = createStatus.success
          rambleTransactions.value[transactionIndex].response = response
          successCount += 1
          continue
        }

        rambleTransactions.value[transactionIndex].status = createStatus.error
        rambleTransactions.value[transactionIndex].error = getTransactionCreateErrorMessage(response)
      } catch (error) {
        if (sessionId !== rambleSessionId.value) {
          return
        }

        rambleTransactions.value[transactionIndex].status = createStatus.error
        rambleTransactions.value[transactionIndex].error = getTransactionCreateErrorMessage(error)
      }
    }

    if (successCount > 0) {
      UIUtils.showToastSuccess(t('transaction.assistant_ramble_created_toast', successCount))
    }

    if (failedRambleTransactionsCount.value > 0) {
      return
    }

    const savedRamblesDeleted = !hasLoadedSavedRambles.value || (await deleteLoadedSavedRambles())
    if (!savedRamblesDeleted) {
      rambleError.value = 'Transactions were created, but saved rambles could not be deleted.'
      return
    }

    closeRamblePopup()
  } finally {
    if (sessionId === rambleSessionId.value) {
      currentCreateIndex.value = 0
      isCreatingRambleTransactions.value = false
    }
  }
}

watch(showRamblePopup, (newValue) => {
  if (!newValue) {
    inputCardRef.value?.stopRecording()
    resetRamble()
  }
})

onMounted(async () => {
  await refreshSavedRambleCount({ showLoading: false })
})
</script>
