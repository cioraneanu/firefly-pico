<template>
  <d-page :title="$t('transaction.assistant_ramble_title')" :description="$t('desktop.ramble_description')">
    <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <d-card :title="$t('desktop.ramble')" :description="$t('transaction.assistant_ramble_input_hint')">
        <template #actions>
          <div class="flex items-center gap-2">
            <div class="w-40">
              <d-select v-model="speechLanguage" :options="LanguageConstants.OPTIONS_LIST" :get-label="(option) => option.name" :get-icon="() => IconLanguage" :searchable="false" />
            </div>
            <d-button
              :icon="isRecording ? IconPlayerStop : IconMicrophone"
              :class="isRecording && 'border-danger/40 text-danger'"
              :aria-label="$t('transaction.assistant_ramble_listening')"
              size="icon"
              @click="toggleRecording"
            />
          </div>
        </template>
        <div class="flex flex-col gap-3">
          <d-textarea v-model="rambleText" :rows="7" :placeholder="$t('transaction.assistant_ramble_placeholder')" />
          <span v-if="isRecording" class="inline-flex items-center gap-1.5 text-[13px] text-dim">
            <i class="size-2 animate-pulse rounded-full bg-danger" />
            {{ speechTemporary || $t('transaction.assistant_ramble_listening') }}
          </span>

          <div v-if="savedRambles.length" class="divide-y divide-line rounded-lg border border-line">
            <div v-for="saved in savedRambles" :key="saved.id" class="flex items-center gap-2 px-3 py-2.5">
              <span class="grid size-7 shrink-0 place-items-center rounded-md bg-soft text-dim">
                <component :is="saved.has_voice ? IconMicrophone : IconAlignLeft" :size="16" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="break-words text-sm">{{ saved.text }}</p>
                <p class="mt-0.5 text-xs text-dim">{{ saved.created_at && DateUtils.dateToUIWithTime(new Date(saved.created_at)) }}</p>
              </div>
              <d-button
                v-if="saved.has_voice"
                variant="ghost"
                size="icon-sm"
                :loading="loadingVoiceRambleId === saved.id"
                :icon="playingVoiceRambleId === saved.id ? IconPlayerStop : IconPlayerPlay"
                @click="toggleSavedRambleVoice(saved)"
              />
              <d-button variant="ghost" size="icon-sm" :icon="IconTrash" class="text-dim" @click="deleteSavedRamble(saved)" />
            </div>
          </div>
        </div>
        <template #footer>
          <d-button :icon="IconList" :loading="isLoadingSavedRambles" @click="fetchSavedRambles">
            {{ $t('transaction.assistant_ramble_load_saved') }}
            <d-badge v-if="savedRamblesCount">{{ savedRamblesCount }}</d-badge>
          </d-button>
          <d-button v-if="savedRambles.length" variant="danger" :icon="IconTrash" :loading="isDeletingLoadedSavedRambles" @click="deleteLoadedSavedRambles()">{{ $t('delete') }}</d-button>
          <span class="flex-1" />
          <d-button variant="primary" :icon="IconSparkles" :loading="isInterpreting" :disabled="!rambleText.trim() && !savedRambles.length" @click="interpret">{{
            $t('transaction.assistant_ramble_interpret')
          }}</d-button>
        </template>
      </d-card>

      <d-card :title="$t('transaction.assistant_ramble_preview')" flush>
        <p v-if="rambleError" class="mx-4 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{{ rambleError }}</p>
        <div v-if="rambleTransactions.length" class="divide-y divide-line border-t border-line">
          <div v-for="draft in rambleTransactions" :key="draft.id" :class="['flex items-start gap-3 px-4 py-3', draft.status === rambleStatus.success && 'opacity-60']">
            <d-tile :icon="draftIcon(draft)" />
            <button type="button" class="flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 text-left" @click="editing = cloneDeep(draft)">
              <span class="flex items-baseline gap-3">
                <span class="truncate font-medium">{{ Transaction.getDescription(draft.item) }}</span>
                <d-amount class="ml-auto" :value="Transaction.getAmountFormatted(draft.item)" :type="Transaction.getFirstSplit(draft.item)?.type" />
              </span>
              <span class="flex flex-wrap gap-1">
                <d-chip v-for="account in draftAccounts(draft)" :key="account.id" :icon="IconCreditCard">{{ Account.getDisplayName(account) }}</d-chip>
                <d-chip v-for="category in Transaction.getCategories(draft.item)" :key="category.id" :icon="IconCategory">{{ Category.getDisplayName(category) }}</d-chip>
                <d-chip v-for="tag in Transaction.getTags(draft.item).filter(Boolean)" :key="tag.id" :icon="IconTag">{{ Tag.getDisplayName(tag) }}</d-chip>
              </span>
              <span v-if="draft.error" class="text-xs text-danger">{{ draft.error }}</span>
            </button>
            <icon-loader-2 v-if="draft.status === rambleStatus.creating" :size="16" class="d-spin mt-2 text-dim" />
            <icon-circle-check v-else-if="draft.status === rambleStatus.success" :size="16" class="mt-2 text-success" />
            <d-button v-else variant="ghost" size="icon-sm" :icon="IconX" class="text-dim" @click="removeRambleTransaction(draft)" />
          </div>
        </div>
        <d-empty v-else :icon="IconSparkles" :title="$t(hasInterpreted ? 'transaction.assistant_ramble_no_results' : 'transaction.assistant_ramble_no_transactions_yet')" />
        <template v-if="rambleTransactions.length" #footer>
          <div v-if="hasCreateProgress" class="flex min-w-0 flex-1 flex-col gap-1.5">
            <span class="text-[13px] text-dim">{{ createProgressLabel }}</span>
            <d-progress :value="createProgressPercentage" />
          </div>
          <span v-else class="flex-1" />
          <d-button variant="primary" :icon="IconCheck" :loading="isCreatingRambleTransactions" :disabled="createButtonCount === 0" @click="createRambleTransactions">{{ createButtonLabel }}</d-button>
        </template>
      </d-card>
    </div>

    <d-dialog :open="!!editing" :title="$t('transaction.assistant_ramble_edit_title')" size="xl" @close="editing = null">
      <d-transaction-fields v-if="editing" v-model="editing.item" form-name="ramble-draft" @submit="saveDraft" />
      <template #footer>
        <d-button @click="editing = null">{{ $t('cancel') }}</d-button>
        <d-button variant="primary" type="submit" form="ramble-draft">{{ $t('save') }}</d-button>
      </template>
    </d-dialog>
  </d-page>
</template>

<script setup>
import {
  IconAlignLeft,
  IconCategory,
  IconCheck,
  IconCircleCheck,
  IconCreditCard,
  IconLanguage,
  IconList,
  IconLoader2,
  IconMicrophone,
  IconPlayerPlay,
  IconPlayerStop,
  IconSparkles,
  IconTag,
  IconTrash,
  IconX,
} from '@tabler/icons-vue'
import { cloneDeep } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import * as LanguageConstants from '~/core/constants/LanguageConstants'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'
import { rambleStatus } from '~/core/composables/useRamble'

const editing = ref(null)

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
    reset()
    await navigateTo(RouteConstants.ROUTE_TRANSACTION_LIST)
  },
})

const { speechTemporary, speechLanguageCode, isRecording, stopRecording, toggleRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice } = useRambleDictation(rambleText)

const speechLanguage = computed({
  get: () => LanguageConstants.OPTIONS_LIST.find((option) => option.code === speechLanguageCode.value),
  set: (option) => (speechLanguageCode.value = option.code),
})

const draftAccounts = (draft) => [Transaction.getFirstSplit(draft.item)?.accountSource, Transaction.getFirstSplit(draft.item)?.accountDestination].filter(Boolean)
const draftIcon = (draft) => Category.getIcon(Transaction.getCategories(draft.item)[0]) ?? IconSparkles

const interpret = () => {
  stopRecording()
  interpretRambleText()
}

const saveDraft = () => {
  updateRambleTransaction(editing.value)
  editing.value = null
}

onMounted(refreshSavedRambleCount)
</script>
