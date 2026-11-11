<template>
  <button v-if="appStore.llmIsConfigured" type="button" class="mx-btn out mx-btn40 relative" :aria-label="$t('transaction.assistant_ramble_title')" @click="openRamblePopup">
    <app-icon :icon="IconMicrophone" :size="16" :stroke="2" />
    <span v-if="savedRamblesCount > 0" class="mx-badge pri">{{ savedRamblesCount > 99 ? '99+' : savedRamblesCount }}</span>
  </button>

  <app-sheet v-model:show="showRamblePopup" :title="$t('transaction.assistant_ramble_title')" full>
    <div class="flex flex-col gap-3 pb-3" :class="{ 'pointer-events-none': isRambleFormDisabled }" :inert="isRambleFormDisabled" :aria-busy="isInterpreting">
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

      <div v-if="rambleError" class="mx-note mxr-error">
        <app-icon :icon="IconAlertTriangle" :size="16" :stroke="2" />
        <span class="wrap-anywhere">{{ rambleError }}</span>
      </div>

      <section class="mx-card mxr-card">
        <div class="mxr-ch">
          <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_preview') }}</h2>
          <span v-if="rambleTransactions.length > 0" class="mx-badge">{{ rambleTransactions.length }}</span>
        </div>

        <div v-if="rambleTransactions.length > 0" class="mx-list">
          <ramble-transaction-item
            v-for="(transaction, index) in rambleTransactions"
            :key="transaction.id"
            v-model="rambleTransactions[index]"
            @delete="removeRambleTransaction"
            @edit="openRambleTransaction"
          />
        </div>

        <div v-else class="mx-inline-empty">
          <app-icon :icon="IconSparkles" :size="16" :stroke="2" />
          <span>{{ hasInterpreted ? $t('transaction.assistant_ramble_no_results') : $t('transaction.assistant_ramble_no_transactions_yet') }}</span>
        </div>
      </section>

      <div v-if="hasCreateProgress" class="flex flex-col gap-2 px-1">
        <div class="mx-row__s flex items-center gap-2">
          <span v-if="isCreatingRambleTransactions" class="mx-spin" />
          <span>{{ createProgressLabel }}</span>
        </div>
        <div class="mx-prog"><span :style="{ width: `${createProgressPercentage}%` }" /></div>
      </div>
    </div>

    <template v-if="rambleTransactions.length > 0" #footer>
      <button type="button" class="mx-btn pri" :disabled="createButtonCount === 0 || isCreatingRambleTransactions" @click="createRambleTransactions">
        <span v-if="isCreatingRambleTransactions" class="mx-spin" />
        <app-icon v-else :icon="IconCheck" :size="16" :stroke="2" />
        <span>{{ createButtonLabel }}</span>
      </button>
    </template>
  </app-sheet>

  <ramble-transaction-edit-popup v-model:show="showRambleTransactionPopup" v-model="editingRambleTransaction" @save="onRambleTransactionEdited" />
</template>

<script setup>
import { IconAlertTriangle, IconCheck, IconMicrophone, IconSparkles } from '@tabler/icons-vue'
import { cloneDeep } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import RambleInputCard from '~/mobile/components/transaction/ramble/ramble-input-card.vue'
import RambleTransactionItem from '~/mobile/components/transaction/ramble/ramble-transaction-item.vue'
import RambleTransactionEditPopup from '~/mobile/components/transaction/ramble/ramble-transaction-edit-popup.vue'

// Dictate button of the assistant + the "Dictate transactions" sheet (design: MX-Ramble).
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
