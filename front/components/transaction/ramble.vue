<template>
  <van-badge v-if="appStore.llmIsConfigured" :content="savedRamblesCount" :show-zero="false">
    <van-button size="small" class="cursor-pointer" @click="openRamblePopup">
      <icon-wand :size="18" />
    </van-button>
  </van-badge>

  <app-popup v-model:show="showRamblePopup" :popup-style="ramblePopupStyle">
    <div class="display-flex flex-direction-column h-100 m-h-0">
      <div class="display-flex align-items-start gap-2 px-3 py-2 border-bottom">
        <div class="flex-1-w">
          <div class="font-600 text-size-16">{{ $t('transaction.assistant_ramble_title') }}</div>
          <div class="text-size-12 text-muted mt-5">
            {{ $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) }}
          </div>
          <div v-if="rambleTransactions.length > 0" class="text-size-12 text-muted mt-5">{{ $t('transaction.assistant_ramble_preview') }}</div>
        </div>

        <van-button size="small" class="cursor-pointer" @click="closeRamblePopup">
          <app-icon :icon="TablerIconConstants.close" :size="18" />
        </van-button>
      </div>

      <div class="flex-1 m-h-0 overflow-auto display-flex flex-direction-column gap-2 p-3">
        <van-cell-group inset class="no-margin overflow-hidden">
          <div class="flex-center-vertical gap-2">
            <div class="text-size-13">Type or use your microphone</div>
            <van-button :type="isRecording ? 'danger' : 'primary'" size="small" class="cursor-pointer" @click="toggleRecording">
              <app-icon :icon="isRecording ? TablerIconConstants.stop : TablerIconConstants.microphone" :size="16" />
            </van-button>

            <div v-if="speechTemporary" class="display-flex flex-center-vertical gap-1 text-size-12 text-muted px-3 pb-2">
              <app-icon :icon="TablerIconConstants.microphone" :size="14" />
              <span>{{ speechTemporary }}</span>
            </div>
          </div>
          <app-field
            v-model="rambleText"
            class="van-cell-no-padding compact mt-1"
            label=""
            type="textarea"
            rows="5"
            autosize
            :placeholder="$t('transaction.assistant_ramble_placeholder')"
            :clearable="true"
          />

          <div class="display-flex flex-center-vertical flex-wrap gap-2 mt-2">
            <div class="flex-1 text-size-12 text-muted">{{ $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) }}</div>
            <van-button size="small" plain class="cursor-pointer" :loading="isLoadingSavedRambles" @click="fetchSavedRambles">
              <app-icon :icon="TablerIconConstants.list" :size="16" />
              {{ $t('transaction.assistant_ramble_load_saved') }}
            </van-button>
            <van-button v-if="hasLoadedSavedRambles" size="small" type="danger" plain class="cursor-pointer" :loading="isDeletingLoadedSavedRambles" @click="deleteLoadedSavedRambles">
              <van-icon name="delete-o" size="16" />
              {{ $t('transaction.assistant_ramble_delete_saved') }}
            </van-button>
          </div>

          <van-button type="" plain size="small" class="w-100 mt-2" :loading="isInterpreting" :disabled="!canInterpretRamble" @click="interpretRambleText">
            <app-icon :icon="TablerIconConstants.magic" :size="16" />
            {{ $t('transaction.assistant_ramble_interpret') }}
          </van-button>
        </van-cell-group>

        <div v-if="rambleError" class="text-size-12 text-danger px-3">{{ rambleError }}</div>

        <template v-if="savedRambles.length > 0">
          <div class="display-flex flex-direction-column gap-2">
            <van-cell-group v-for="(ramble, index) in savedRambles" :key="ramble.id" inset class="no-margin">
              <div class="display-flex align-items-start gap-2 p-10">
                <div class="tag-gray text-size-12">{{ index + 1 }}</div>
                <div class="flex-1-w text-size-13 word-break-word">{{ ramble.text }}</div>
              </div>
            </van-cell-group>
          </div>
        </template>

        <template v-if="rambleTransactions.length > 0">
          <div class="display-flex flex-direction-column gap-2">
            <ramble-transaction
              v-for="(transaction, index) in rambleTransactions"
              :key="transaction.id"
              v-model="rambleTransactions[index]"
              :index="index"
              @delete="removeRambleTransaction"
              @edit="openRambleTransaction"
            />
          </div>
        </template>

        <div v-else class="text-size-12 text-muted text-center p-20">
          {{ hasInterpreted ? $t('transaction.assistant_ramble_no_results') : $t('transaction.assistant_ramble_no_transactions_yet') }}
        </div>
      </div>

      <div v-if="hasCreateProgress" class="px-3 py-2 border-top">
        <div class="display-flex flex-center-vertical gap-2 text-size-12 text-muted mb-2">
          <van-loading v-if="isCreatingRambleTransactions" size="16" />
          <div>{{ createProgressLabel }}</div>
        </div>
        <van-progress :percentage="createProgressPercentage" />
      </div>

      <div class="display-flex gap-2 p-3 border-top">
        <van-button block type="primary" class="cursor-pointer" :loading="isCreatingRambleTransactions" :disabled="createButtonCount === 0" @click="createRambleTransactions">
          {{ createButtonLabel }}
        </van-button>
      </div>
    </div>
  </app-popup>

  <app-popup v-model:show="showRambleTransactionPopup" :popup-style="rambleTransactionPopupStyle">
    <div class="display-flex flex-direction-column h-100 m-h-0">
      <div class="display-flex flex-center-vertical gap-2 px-3 py-2 border-bottom">
        <div class="font-600 text-size-16 flex-1">{{ $t('transaction.assistant_ramble_edit_title') }}</div>
        <van-button size="small" class="cursor-pointer" @click="closeRambleTransactionPopup">
          <app-icon :icon="TablerIconConstants.close" :size="18" />
        </van-button>
      </div>

      <div class="flex-1 m-h-0 overflow-auto">
        <transaction-form v-if="editingRambleTransaction" ref="editingTransactionFormRef" v-model="editingRambleTransaction.item" :form-name="editingFormName" />
      </div>

      <div class="display-flex gap-2 p-3 border-top">
        <van-button block class="cursor-pointer" @click="closeRambleTransactionPopup">{{ $t('cancel') }}</van-button>
        <van-button block type="primary" class="cursor-pointer" @click="saveRambleTransactionEdit">{{ $t('save') }}</van-button>
      </div>
    </div>
  </app-popup>
</template>

<script setup>
import { cloneDeep } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'
import { IconWand } from '@tabler/icons-vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AssistantRepository from '~/repository/AssistantRepository.js'
import * as LanguageConstants from '~/constants/LanguageConstants.js'
import { useSpeechRecognition } from '~/composables/useSpeechRecognition.js'
import RambleTransaction from '~/components/transaction/RambleTransaction.vue'
import { useRambleTransactionResolver } from '~/composables/useRambleTransactionResolver.js'
import { useTransactionAssistantDraft } from '~/composables/useTransactionAssistantDraft.js'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import TransactionForm from '~/components/transaction/TransactionForm.vue'
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
const speechTemporary = ref('')
const isInterpreting = ref(false)
const isCreatingRambleTransactions = ref(false)
const hasInterpreted = ref(false)
const rambleError = ref('')
const currentCreateIndex = ref(0)
const editingRambleTransaction = ref(null)
const editingTransactionFormRef = ref(null)
const editingFormName = 'ramble-transaction-form'
const rambleSessionId = ref(0)

const ramblePopupStyle = computed(() => {
  if (appStore.isDesktopLayout) {
    return { height: '80vh', maxHeight: '80vh' }
  }

  return { height: '90%' }
})

const rambleTransactionPopupStyle = computed(() => {
  if (appStore.isDesktopLayout) {
    return { width: '94vw', maxHeight: '92vh' }
  }

  return { height: '96%' }
})

const speechLanguage = computed(() => {
  const languageMap = {
    en: LanguageConstants.LANGUAGE_ENGLISH,
    ro: LanguageConstants.LANGUAGE_ROMANIAN,
    pl: LanguageConstants.LANGUAGE_POLISH,
    'ru-RU': LanguageConstants.LANGUAGE_RUSSIAN,
    'fr-FR': LanguageConstants.LANGUAGE_FRENCH,
  }

  return { code: languageMap[profileStore.language] ?? profileStore.language ?? LanguageConstants.LANGUAGE_ENGLISH }
})

const canInterpretRamble = computed(() => {
  return !!rambleText.value.trim() || savedRambles.value.length > 0
})

const hasLoadedSavedRambles = computed(() => {
  return loadedSavedRambleIds.value.length > 0
})

const createdRambleTransactionsCount = computed(() => rambleTransactions.value.filter((transaction) => transaction.status === createStatus.success).length)
const failedRambleTransactionsCount = computed(() => rambleTransactions.value.filter((transaction) => transaction.status === createStatus.error).length)
const processedRambleTransactionsCount = computed(() => createdRambleTransactionsCount.value + failedRambleTransactionsCount.value)
const createButtonTransactions = computed(() => rambleTransactions.value.filter((transaction) => transaction.status !== createStatus.success))
const createButtonCount = computed(() => createButtonTransactions.value.length)
const hasCreateProgress = computed(() => isCreatingRambleTransactions.value || createdRambleTransactionsCount.value > 0 || failedRambleTransactionsCount.value > 0)
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

const appendDictatedText = (text) => {
  text = (text ?? '').trim()
  if (!text) {
    return
  }

  rambleText.value = [rambleText.value.trim(), text].filter(Boolean).join(' ')
}

const { startRecording, stopRecording, isRecording } = useSpeechRecognition({
  language: speechLanguage,
  continuous: true,
  interimResults: true,
  onSpeechFinished: appendDictatedText,
  onSpeechTemporary: (text) => {
    speechTemporary.value = text
  },
})

const isResponseSuccessful = (response) => {
  return response?.status >= 200 && response?.status < 300
}

const refreshSavedRambleCount = async ({ showLoading = false } = {}) => {
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
  stopRecording()
  showRamblePopup.value = false
  resetRamble()
}

const resetRamble = () => {
  rambleSessionId.value += 1
  rambleText.value = ''
  savedRambles.value = []
  loadedSavedRambleIds.value = []
  rambleTransactions.value = []
  speechTemporary.value = ''
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

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
    return
  }

  startRecording()
}

const getRambleErrorMessage = (error) => {
  return error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.message ?? 'Assistant LLM request failed.'
}

const getTransactionCreateErrorMessage = (error) => {
  return error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error?.data?.message ?? error?.message ?? 'Failed to create transaction.'
}

const getSavedRamblesText = () => {
  return savedRambles.value
    .map((ramble) => ramble.text?.trim())
    .filter(Boolean)
    .join('\n')
}

const getInterpretationText = () => {
  return [rambleText.value.trim(), getSavedRamblesText()].filter(Boolean).join('\n')
}

const interpretRambleText = async () => {
  const text = getInterpretationText()
  if (!text) {
    return
  }

  const sessionId = rambleSessionId.value
  stopRecording()
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

const closeRambleTransactionPopup = () => {
  showRambleTransactionPopup.value = false
  editingRambleTransaction.value = null
}

const saveRambleTransactionEdit = async () => {
  if (!editingRambleTransaction.value) {
    return
  }

  try {
    await editingTransactionFormRef.value?.validate()
  } catch {
    UIUtils.showToastError('Form has invalid values. Check the red fields :)')
    return
  }

  const index = rambleTransactions.value.findIndex((transaction) => transaction.id === editingRambleTransaction.value.id)
  if (index >= 0) {
    const existingTransaction = rambleTransactions.value[index]
    rambleTransactions.value[index] = {
      ...existingTransaction,
      item: cloneDeep(editingRambleTransaction.value.item),
      status: existingTransaction.status === createStatus.success ? createStatus.success : createStatus.pending,
      error: existingTransaction.status === createStatus.success ? existingTransaction.error : null,
    }
  }

  closeRambleTransactionPopup()
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
      UIUtils.showToastSuccess(`${successCount} transaction${successCount === 1 ? '' : 's'} created`)
    }

    if (failedRambleTransactionsCount.value > 0) {
      rambleError.value = createProgressLabel.value
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
    stopRecording()
  }
})

onMounted(async () => {
  await refreshSavedRambleCount({ showLoading: false })
})
</script>
