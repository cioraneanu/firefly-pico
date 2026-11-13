<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <div class="flex flex-col gap-3" :inert="isInterpreting" :aria-busy="isInterpreting">
        <ramble-input-card
          ref="inputCardRef"
          v-model="rambleText"
          :saved-rambles="savedRambles"
          :is-loading-saved="isLoadingSavedRambles"
          :is-adding="isAddingRamble"
          :is-interpreting="isInterpreting"
          :is-disabled="isInterpreting || isCreatingRambleTransactions"
          :update-ramble="updateSavedRamble"
          @add="addRamble"
          @interpret="interpretRambleText({ rambles: savedRambles })"
          @delete-all="deleteAllSavedRambles"
          @delete-ramble="deleteSavedRamble"
        />

        <div v-if="rambleError" class="mx-note mxr-error">
          <app-icon :icon="IconAlertTriangle" :size="16" :stroke="2" />
          <span class="wrap-anywhere">{{ rambleError }}</span>
        </div>

        <section class="mx-card mxr-card">
          <div class="mxr-ch">
            <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_preview') }}</h2>
            <span class="mx-badge">{{ rambleTransactions.length }}</span>
          </div>

          <div v-if="rambleTransactions.length > 0" class="mx-list">
            <ramble-transaction-item
              v-for="transaction in rambleTransactions"
              :key="transaction.id"
              :transaction="transaction"
              @toggle="toggleRambleTransaction"
              @edit="openRambleTransaction"
              @delete="removeRambleTransaction"
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

        <div v-if="rambleTransactions.length > 0" class="mxr-create">
          <button type="button" class="mx-btn pri" :disabled="createButtonCount === 0 || isCreatingRambleTransactions" @click="createRambleTransactions">
            <span v-if="isCreatingRambleTransactions" class="mx-spin" />
            <app-icon v-else :icon="IconCheck" :size="16" :stroke="2" />
            <span>{{ createButtonLabel }}</span>
          </button>
        </div>
      </div>
    </main>

    <ramble-transaction-edit-popup v-model:show="isEditing" v-model="editingTransaction" @save="updateRambleTransaction" />
  </div>
</template>

<script setup>
import { IconAlertTriangle, IconCheck, IconSparkles } from '@tabler/icons-vue'
import { cloneDeep } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RambleInputCard from '~/mobile/components/transaction/ramble/ramble-input-card.vue'
import RambleTransactionItem from '~/mobile/components/transaction/ramble/ramble-transaction-item.vue'
import RambleTransactionEditPopup from '~/mobile/components/transaction/ramble/ramble-transaction-edit-popup.vue'

// Dictate transactions (design: MX-Ramble): add rambles, interpret them all, check the drafts, create the included ones.
const { t } = useI18n()
const route = useRoute()

const {
  rambleText,
  savedRambles,
  isLoadingSavedRambles,
  isAddingRamble,
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
  fetchSavedRambles,
  addRamble,
  updateSavedRamble,
  deleteSavedRamble,
  deleteAllSavedRambles,
  resetDrafts,
  interpretRambleText,
  removeRambleTransaction,
  toggleRambleTransaction,
  updateRambleTransaction,
  createRambleTransactions,
} = useRamble({ onCreated: () => resetDrafts() })

// The assistant field of the new transaction page hands over its text
rambleText.value = route.query.text ?? ''

const isEditing = ref(false)
const editingTransaction = ref(null)
const openRambleTransaction = (transaction) => {
  editingTransaction.value = cloneDeep(transaction)
  isEditing.value = true
}

onMounted(fetchSavedRambles)

useToolbar().init({
  title: t('transaction.assistant_ramble_title'),
  subtitle: computed(() => (isLoadingSavedRambles.value ? t('transaction.assistant_ramble_loading_saved') : t('transaction.assistant_ramble_waiting', savedRambles.value.length))),
  backRoute: RouteConstants.ROUTE_TRANSACTION_ID,
})
</script>
