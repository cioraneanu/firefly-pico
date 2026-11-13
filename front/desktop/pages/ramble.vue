<template>
  <d-page :title="$t('transaction.assistant_ramble_title')" :description="$t('desktop.ramble_description')">
    <template #actions>
      <d-button :icon="IconSettings" :to="RouteConstants.ROUTE_SETTINGS_ASSISTANT">{{ $t('settings.assistant_entry') }}</d-button>
    </template>

    <div class="grid grid-cols-3 gap-2" role="list">
      <button
        v-for="(item, index) in steps"
        :key="item.step"
        type="button"
        role="listitem"
        :aria-current="step === item.step ? 'step' : undefined"
        :disabled="step <= item.step || step === STEP_DONE || isBusy"
        :class="[
          'flex min-w-0 items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 text-left',
          step === item.step ? 'ring-[1.5px] ring-fg' : 'ring-1 ring-line',
          step > item.step && step !== STEP_DONE && !isBusy && 'cursor-pointer hover:bg-soft',
        ]"
        @click="step = item.step"
      >
        <span
          :class="[
            'grid size-6.5 shrink-0 place-items-center rounded-full text-[12.5px] font-semibold',
            step === item.step ? 'bg-primary text-on-primary' : step > item.step ? 'bg-success/15 text-success' : 'bg-soft text-dim',
          ]"
        >
          <icon-check v-if="step > item.step" :size="14" :stroke-width="2.5" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="flex min-w-0 flex-col">
          <b class="text-[13.5px] font-semibold">{{ $t(item.title) }}</b>
          <small class="truncate text-xs text-dim">{{ $t(item.hint) }}</small>
        </span>
      </button>
    </div>

    <!-- 1. Capture: record or type, keep it as a saved ramble, pick the saved rambles to interpret -->
    <div v-if="step === STEP_CAPTURE" class="grid items-start gap-4 lg:grid-cols-2">
      <d-card :title="$t('transaction.assistant_ramble_record')" :description="$t('transaction.assistant_ramble_record_hint')">
        <template #actions>
          <div class="w-37">
            <d-select v-model="speechLanguage" :options="LanguageConstants.OPTIONS_LIST" :get-label="(option) => option.name" :get-icon="() => IconLanguage" :searchable="false" />
          </div>
        </template>
        <div class="flex flex-col items-center gap-3.5">
          <button
            type="button"
            :class="['d-ramble-mic mt-1 grid size-22 cursor-pointer place-items-center rounded-full', isRecording ? 'on bg-danger text-white' : 'bg-primary text-on-primary hover:bg-primary/85']"
            :aria-pressed="isRecording"
            :aria-label="$t(isRecording ? 'transaction.assistant_ramble_stop_dictation' : 'transaction.assistant_ramble_start_dictation')"
            @click="toggleRecording"
          >
            <component :is="isRecording ? IconPlayerStop : IconMicrophone" :size="32" :stroke-width="1.75" />
          </button>
          <div class="flex flex-col items-center gap-0.5">
            <b class="text-[22px] leading-7 font-semibold tabular-nums">{{ recordingTime }}</b>
            <span class="text-[13px] text-dim">{{
              isRecording ? $t('transaction.assistant_ramble_listening_in', { language: speechLanguage?.name }) : $t('transaction.assistant_ramble_tap_to_record')
            }}</span>
          </div>
          <span :class="['d-ramble-wave flex h-11 w-full max-w-90 items-center gap-0.75', isRecording && 'on']" aria-hidden="true">
            <i v-for="(height, index) in waveHeights" :key="index" :style="{ height: `${height}%`, animationDelay: `${(index * 73) % 900}ms` }" />
          </span>
          <p v-if="isRecording && speechTemporary" class="self-stretch text-[13px] text-dim">{{ speechTemporary }}</p>
          <div class="flex flex-col gap-2 self-stretch pt-1">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ $t('transaction.assistant_ramble_captured_text') }}</span>
              <d-button v-if="rambleText.trim()" variant="ghost" size="xs" @click="rambleText = ''">{{ $t('clear') }}</d-button>
            </div>
            <d-textarea v-model="rambleText" :rows="3" :placeholder="$t('transaction.assistant_ramble_placeholder')" />
          </div>
        </div>
        <template #footer>
          <d-button class="w-full" :icon="IconArrowRight" :loading="isAddingRamble" :disabled="!isRecording && !rambleText.trim()" @click="addCaptured">
            {{ $t(isRecording ? 'transaction.assistant_ramble_stop_and_add' : 'transaction.assistant_ramble_add') }}
          </d-button>
        </template>
      </d-card>

      <d-card :title="$t('transaction.assistant_ramble_saved')" :description="$t('transaction.assistant_ramble_saved_hint')" flush>
        <template v-if="savedRambles.length" #actions>
          <d-button variant="ghost" size="sm" @click="toggleAllPickedRambles">{{ $t(isAllPicked ? 'transaction.assistant_ramble_clear_selection' : 'todo_page.select_all') }}</d-button>
        </template>
        <div v-if="isLoadingSavedRambles" class="flex flex-col gap-3 border-t border-line p-4">
          <span v-for="n in 2" :key="n" class="h-9 animate-pulse rounded-lg bg-soft" />
        </div>
        <div v-else-if="savedRambles.length" class="divide-y divide-line border-t border-line" role="list">
          <div v-for="saved in savedRambles" :key="saved.id" class="flex items-start gap-2.5 px-4 py-2.5" role="listitem">
            <button
              type="button"
              role="checkbox"
              :aria-checked="pickedRambleIds.includes(saved.id)"
              :aria-label="$t('transaction.assistant_ramble_include')"
              :class="[
                'mt-1.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded border',
                pickedRambleIds.includes(saved.id) ? 'border-primary bg-primary text-on-primary' : 'border-field dark:bg-field/30',
              ]"
              @click="togglePickedRamble(saved)"
            >
              <icon-check v-if="pickedRambleIds.includes(saved.id)" :size="12" :stroke-width="3" />
            </button>
            <d-tile :icon="saved.has_voice ? IconMicrophone : IconKeyboard" size="sm" muted class="mt-0.5 size-7" />
            <div v-if="editingId === saved.id" class="flex min-w-0 flex-1 flex-col gap-2">
              <d-textarea v-model="editingText" :rows="2" />
              <div class="flex items-center justify-between gap-1.5">
                <span class="text-xs text-dim">{{ $t(saved.has_voice ? 'transaction.assistant_ramble_fix_transcript' : 'transaction.assistant_ramble_edit_text') }}</span>
                <span class="flex gap-1.5">
                  <d-button size="sm" @click="editingId = null">{{ $t('cancel') }}</d-button>
                  <d-button variant="primary" size="sm" :icon="IconCheck" :loading="isSavingEdit" @click="saveEdit(saved)">{{ $t('save') }}</d-button>
                </span>
              </div>
            </div>
            <div v-else class="min-w-0 flex-1">
              <p class="text-sm break-words">{{ saved.text }}</p>
              <p class="mt-0.5 text-xs text-dim">{{ rambleMeta(saved) }}</p>
            </div>
            <d-button
              v-if="saved.has_voice"
              variant="ghost"
              size="icon-sm"
              :loading="loadingVoiceRambleId === saved.id"
              :icon="playingVoiceRambleId === saved.id ? IconPlayerStop : IconPlayerPlay"
              :aria-label="$t(playingVoiceRambleId === saved.id ? 'transaction.assistant_ramble_stop_playback' : 'transaction.assistant_ramble_play')"
              @click="toggleSavedRambleVoice(saved)"
            />
            <d-button v-if="editingId !== saved.id" variant="ghost" size="icon-sm" :icon="IconPencil" :aria-label="$t('transaction.assistant_ramble_edit_text')" @click="startEdit(saved)" />
            <d-button variant="ghost" size="icon-sm" :icon="IconTrash" :aria-label="$t('delete')" @click="deleteSavedRamble(saved)" />
          </div>
        </div>
        <d-empty v-else :icon="IconArchive" :title="$t('transaction.assistant_ramble_no_saved')" class="border-t border-line" />
        <template #footer>
          <div class="flex w-full flex-col items-stretch gap-2">
            <d-button variant="primary" class="w-full" :icon="IconWand" :loading="isInterpreting" :disabled="interpretCount === 0" @click="interpret">
              {{ isInterpreting ? $t('transaction.assistant_ramble_interpreting') : $t('transaction.assistant_ramble_interpret_count', interpretCount) }}
            </d-button>
            <span class="text-center text-[12.5px] text-dim">{{ $t(interpretCount ? 'transaction.assistant_ramble_interpret_hint' : 'transaction.assistant_ramble_capture_hint') }}</span>
          </div>
        </template>
      </d-card>
    </div>

    <!-- 2. Check the drafts -->
    <d-card
      v-else-if="step === STEP_DRAFTS"
      class="w-full max-w-215 self-center"
      :title="$t('transaction.assistant_ramble_drafts')"
      :description="$t('transaction.assistant_ramble_drafts_hint')"
      flush
    >
      <template #actions>
        <d-badge>{{ rambleTransactions.length }}</d-badge>
      </template>
      <p v-if="rambleError" class="mx-4 mb-3 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{{ rambleError }}</p>
      <div v-if="rambleTransactions.length" class="max-h-105 divide-y divide-line overflow-y-auto border-t border-line">
        <d-ramble-draft v-for="draft in rambleTransactions" :key="draft.id" :draft="draft" :disabled="isBusy" @edit="editing = cloneDeep(draft)" @remove="removeRambleTransaction(draft)" />
      </div>
      <d-empty v-else :icon="IconWand" :title="$t('transaction.assistant_ramble_no_results')" class="border-t border-line" />
      <template #footer>
        <div class="flex w-full flex-col gap-3">
          <div v-if="hasCreateProgress" class="flex flex-col gap-2">
            <span class="text-[13px] text-dim tabular-nums">{{ createProgressLabel }}</span>
            <d-progress :value="createProgressPercentage" />
          </div>
          <div class="flex items-center gap-2">
            <d-button :icon="IconArrowBackUp" :disabled="isBusy" @click="step = STEP_CAPTURE">{{ $t('back') }}</d-button>
            <span class="flex-1" />
            <d-button variant="primary" :loading="isCreatingRambleTransactions" :disabled="createButtonCount === 0 || isBusy" @click="createRambleTransactions">{{ createButtonLabel }}</d-button>
          </div>
        </div>
      </template>
    </d-card>

    <!-- 3. Done -->
    <section v-else class="flex w-full max-w-140 flex-col items-center gap-2.5 self-center rounded-xl bg-card px-6 py-8 text-center ring-1 ring-fg/10">
      <span class="grid size-14 place-items-center rounded-full bg-success/15 text-success"><icon-circle-check :size="28" /></span>
      <h2 class="text-lg font-semibold">{{ $t('transaction.assistant_ramble_created_toast', createdTransactions.length) }}</h2>
      <p class="text-sm text-dim">{{ $t('transaction.assistant_ramble_done_hint') }}</p>
      <div class="mt-2 mb-3 flex flex-col self-stretch divide-y divide-line rounded-lg text-left ring-1 ring-line">
        <div v-for="draft in createdTransactions" :key="draft.id" class="flex justify-between gap-3 px-3 py-2 text-sm">
          <span class="truncate">{{ Transaction.getDescription(draft.item) }}</span>
          <d-amount :value="Transaction.getAmountFormatted(draft.item)" :type="Transaction.getFirstSplit(draft.item)?.type" />
        </div>
      </div>
      <div class="flex justify-center gap-2">
        <d-button :icon="IconMicrophone" @click="dictateMore">{{ $t('transaction.assistant_ramble_dictate_more') }}</d-button>
        <d-button variant="primary" :icon="IconList" :to="RouteConstants.ROUTE_TRANSACTION_LIST">{{ $t('transaction.assistant_ramble_view_transactions') }}</d-button>
      </div>
    </section>

    <d-dialog :open="!!editing" :title="$t('transaction.assistant_ramble_edit_title')" size="xl" @close="editing = null">
      <d-transaction-fields v-if="editing" v-model="editing.item" form-name="ramble-draft" @submit="saveDraft" />
      <template #footer>
        <d-button variant="danger" :icon="IconTrash" @click="removeEditing">{{ $t('piggy_bank_page.remove') }}</d-button>
        <span class="flex-1" />
        <d-button @click="editing = null">{{ $t('cancel') }}</d-button>
        <d-button variant="primary" type="submit" form="ramble-draft">{{ $t('save') }}</d-button>
      </template>
    </d-dialog>
  </d-page>
</template>

<script setup>
import {
  IconArchive,
  IconArrowBackUp,
  IconArrowRight,
  IconCheck,
  IconCircleCheck,
  IconKeyboard,
  IconLanguage,
  IconList,
  IconMicrophone,
  IconPencil,
  IconPlayerPlay,
  IconPlayerStop,
  IconSettings,
  IconTrash,
  IconWand,
} from '@tabler/icons-vue'
import { cloneDeep } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import * as LanguageConstants from '~/core/constants/LanguageConstants'
import Transaction from '~/core/models/Transaction'
import DateUtils from '~/core/utils/DateUtils'

// Dictate transactions as a 3-step wizard (design: RambleVariants · Guided steps): capture → check drafts → done.
const STEP_CAPTURE = 0
const STEP_DRAFTS = 1
const STEP_DONE = 2
const steps = [
  { step: STEP_CAPTURE, title: 'transaction.assistant_ramble_step_capture', hint: 'transaction.assistant_ramble_step_capture_hint' },
  { step: STEP_DRAFTS, title: 'transaction.assistant_ramble_step_drafts', hint: 'transaction.assistant_ramble_step_drafts_hint' },
  { step: STEP_DONE, title: 'transaction.assistant_ramble_step_done', hint: 'transaction.assistant_ramble_step_done_hint' },
]
const waveHeights = Array.from({ length: 44 }, (_, index) => 20 + ((index * 37) % 60))

const { t } = useI18n()
const step = ref(STEP_CAPTURE)
const editing = ref(null)

const {
  rambleText,
  savedRambles,
  isLoadingSavedRambles,
  isAddingRamble,
  pickedRambleIds,
  pickedRambles,
  isAllPicked,
  rambleTransactions,
  createdTransactions,
  isInterpreting,
  isCreatingRambleTransactions,
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
  togglePickedRamble,
  toggleAllPickedRambles,
  resetDrafts,
  interpretRambleText,
  removeRambleTransaction,
  updateRambleTransaction,
  createRambleTransactions,
} = useRamble({ onCreated: () => (step.value = STEP_DONE) })

const { speechTemporary, speechLanguageCode, isRecording, recordingTime, stopRecording, toggleRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice } =
  useRambleDictation(rambleText)

const speechLanguage = computed({
  get: () => LanguageConstants.OPTIONS_LIST.find((option) => option.code === speechLanguageCode.value),
  set: (option) => (speechLanguageCode.value = option.code),
})

const isBusy = computed(() => isInterpreting.value || isCreatingRambleTransactions.value)
// The captured text goes along with the picked rambles
const interpretCount = computed(() => pickedRambles.value.length + (rambleText.value.trim() ? 1 : 0))

const rambleMeta = (ramble) =>
  [
    ramble.created_at && DateUtils.dateToUIWithTime(new Date(ramble.created_at)),
    !ramble.has_voice && t('transaction.assistant_ramble_typed'),
    ramble.is_edited && t('transaction.assistant_ramble_edited'),
  ]
    .filter(Boolean)
    .join(' · ')

const addCaptured = async () => {
  stopRecording()
  await nextTick()
  await addRamble()
}

const editingId = ref(null)
const editingText = ref('')
const isSavingEdit = ref(false)
const startEdit = (ramble) => {
  editingId.value = ramble.id
  editingText.value = ramble.text ?? ''
}
const saveEdit = async (ramble) => {
  isSavingEdit.value = true
  if (await updateSavedRamble(ramble, editingText.value)) editingId.value = null
  isSavingEdit.value = false
}

const interpret = async () => {
  stopRecording()
  if ((await interpretRambleText()) || rambleError.value) step.value = STEP_DRAFTS
}

const saveDraft = () => {
  updateRambleTransaction(editing.value)
  editing.value = null
}

const removeEditing = () => {
  removeRambleTransaction(editing.value)
  editing.value = null
}

const dictateMore = () => {
  resetDrafts()
  step.value = STEP_CAPTURE
}

onMounted(fetchSavedRambles)
</script>
