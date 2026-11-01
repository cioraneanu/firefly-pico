<template>
  <van-badge v-if="appStore.llmIsConfigured" :content="savedRamblesCount" :show-zero="false" max="99" class="ramble-modern-badge">
    <van-button size="small" class="cursor-pointer ramble-trigger-button" @click="openRamblePopup">
      <app-icon :icon="TablerIconConstants.ramble" :size="16" />
    </van-button>
  </van-badge>

  <app-popup v-model:show="showRamblePopup" :popup-style="ramblePopupStyle">
    <div ref="popupRef" class="flex flex-col h-full min-h-0 relative" :aria-busy="isInterpreting">
      <div class="flex flex-col h-full min-h-0" :class="{ 'pointer-events-none': isRambleFormDisabled }" :inert="isRambleFormDisabled">
        <div class="ramble-header flex items-center gap-2">
          <div class="ramble-header-icon flex items-center justify-center">
            <app-icon :icon="TablerIconConstants.ramble" :size="22" :stroke="1.6" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-16 leading-[normal]">{{ $t('transaction.assistant_ramble_title') }}</div>
            <div class="text-12 text-muted mt-1">
              {{ savedRamblesCount > 0 ? $t('transaction.assistant_ramble_saved_count', { count: savedRamblesCount }) : $t('transaction.assistant_ramble_input_hint') }}
            </div>
          </div>
          <van-button round size="small" class="cursor-pointer ramble-icon-button" @click="closeRamblePopup">
            <app-icon :icon="TablerIconConstants.close" :size="18" />
          </van-button>
        </div>

        <div ref="popupContentRef" class="flex-1 min-h-0 overflow-auto flex flex-col gap-4 p-4 ramble-body">
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
            @delete-ramble="deleteSavedRamble"
          />

          <div v-if="rambleError" class="ramble-error text-12">{{ rambleError }}</div>

          <template v-if="rambleTransactions.length > 0">
            <div class="flex items-center gap-2 px-1">
              <div class="ramble-section-label">{{ $t('transaction.assistant_ramble_preview') }}</div>
              <div class="ramble-count-pill">{{ rambleTransactions.length }}</div>
            </div>
            <van-cell-group inset class="m-0 overflow-hidden">
              <ramble-transaction-item
                v-for="(transaction, index) in rambleTransactions"
                :key="transaction.id"
                v-model="rambleTransactions[index]"
                @delete="removeRambleTransaction"
                @edit="openRambleTransaction"
              />
            </van-cell-group>
          </template>

          <div v-else class="ramble-empty flex-1 flex items-center justify-center flex-col gap-2 text-center">
            <div class="ramble-empty-icon flex items-center justify-center">
              <app-icon :icon="TablerIconConstants.ramble" :size="26" :stroke="1.4" />
            </div>
            <div class="text-13 text-muted">
              {{ hasInterpreted ? $t('transaction.assistant_ramble_no_results') : $t('transaction.assistant_ramble_no_transactions_yet') }}
            </div>
          </div>
        </div>

        <div v-if="hasCreateProgress || rambleTransactions.length > 0" class="p-4 ramble-footer">
          <div v-if="hasCreateProgress" class="mb-4">
            <div class="flex items-center gap-2 text-12 text-muted mb-2">
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
    </div>
  </app-popup>

  <ramble-transaction-edit-popup v-model:show="showRambleTransactionPopup" v-model="editingRambleTransaction" @save="onRambleTransactionEdited" />
</template>

<script setup>
import { cloneDeep } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import RambleInputCard from '~/mobile/components/transaction/ramble/ramble-input-card.vue'
import RambleTransactionItem from '~/mobile/components/transaction/ramble/ramble-transaction-item.vue'
import RambleTransactionEditPopup from '~/mobile/components/transaction/ramble/ramble-transaction-edit-popup.vue'
import { useSwipeToDismiss } from '~/mobile/composables/useSwipeToDismiss'

const props = defineProps({
  assistantText: {
    type: String,
    default: '',
  },
})

const appStore = useAppStore()

const showRamblePopup = ref(false)
const showRambleTransactionPopup = ref(false)
const editingRambleTransaction = ref(null)
const inputCardRef = ref(null)
const popupRef = ref(null)
const popupContentRef = ref(null)

const closeRamblePopup = () => (showRamblePopup.value = false)

const {
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
} = useRamble({
  onCreated: async () => {
    closeRamblePopup()
    await navigateTo(RouteConstants.ROUTE_TRANSACTION_LIST)
  },
})

useSwipeToDismiss({
  onSwipe: closeRamblePopup,
  swipeRef: popupRef,
  scrollRef: popupContentRef,
  showDropdown: showRamblePopup,
})

const ramblePopupStyle = computed(() => (appStore.isDesktopLayout ? { width: 'min(680px, 94vw)', height: '82vh', maxHeight: '82vh', padding: '0' } : { height: '90%' }))
const isRambleFormDisabled = computed(() => isInterpreting.value)

const openRamblePopup = async () => {
  if (!rambleText.value && props.assistantText) rambleText.value = props.assistantText
  showRamblePopup.value = true
  await refreshSavedRambleCount()
}

const openRambleTransaction = (transaction) => {
  if (transaction.status === 'creating') return
  editingRambleTransaction.value = cloneDeep(transaction)
  showRambleTransactionPopup.value = true
}

const onRambleTransactionEdited = (editedTransaction) => {
  updateRambleTransaction(editedTransaction)
  editingRambleTransaction.value = null
}

watch(showRamblePopup, (isShown) => {
  if (isShown) return
  inputCardRef.value?.stopRecording()
  reset()
  showRambleTransactionPopup.value = false
  editingRambleTransaction.value = null
})

onMounted(refreshSavedRambleCount)
</script>
