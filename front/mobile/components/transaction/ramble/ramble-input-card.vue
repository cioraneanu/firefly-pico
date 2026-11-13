<template>
  <section class="mx-card mxr-card mxr-comp">
    <div class="mxr-ch">
      <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_new') }}</h2>
      <span v-if="isRecording" class="mx-rec">
        <span class="mx-wave" aria-hidden="true"><i v-for="n in 7" :key="n" /></span>
        <b>{{ $t('transaction.assistant_ramble_listening') }}</b>
        <span>{{ recordingTime }}</span>
      </span>
      <button
        type="button"
        class="mx-mic mxr-mic"
        :class="{ on: isRecording }"
        :disabled="isDisabled"
        :aria-pressed="isRecording"
        :aria-label="$t(isRecording ? 'transaction.assistant_ramble_stop_dictation' : 'transaction.assistant_ramble_start_dictation')"
        @click="toggleRecording"
      >
        <app-icon :icon="IconMicrophone" :size="16" :stroke="2" />
      </button>
    </div>
    <div class="mxr-cb">
      <textarea v-model="rambleText" rows="2" :placeholder="$t('transaction.assistant_ramble_placeholder')" :disabled="isDisabled" :aria-label="$t('transaction.assistant_ramble_new')" />
      <p v-if="isRecording && speechTemporary" class="mx-d mt-1.5 wrap-anywhere">{{ speechTemporary }}</p>
    </div>
    <button type="button" class="mx-btn mxr-ghostbtn" :disabled="isDisabled || isAdding || (!rambleText.trim() && !isRecording)" @click="onAdd">
      <span v-if="isAdding" class="mx-spin" />
      <app-icon v-else :icon="IconArrowDown" :size="16" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_add') }}</span>
    </button>
  </section>

  <section class="mx-card mxr-card">
    <div class="mxr-ch">
      <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_saved') }}</h2>
      <template v-if="!isLoadingSaved && savedRambles.length > 0">
        <span class="mx-badge">{{ savedRambles.length }}</span>
        <button type="button" class="mx-btn xs dng mxr-delall" :disabled="isDisabled" @click="emit('deleteAll')">
          <app-icon :icon="IconTrash" :size="16" :stroke="2" />
          <span>{{ $t('transaction.assistant_ramble_delete_all') }}</span>
        </button>
      </template>
    </div>

    <div v-if="isLoadingSaved" class="mx-list" aria-busy="true" :aria-label="$t('transaction.assistant_ramble_loading_saved')">
      <div v-for="n in 2" :key="n" class="mx-skrow">
        <span class="mx-sk" />
        <span class="m"><span class="mx-sk" /><span class="mx-sk" /></span>
      </div>
    </div>

    <div v-else-if="savedRambles.length > 0" class="mx-list mxr-saved">
      <template v-for="savedRamble in savedRambles" :key="savedRamble.id">
        <div v-if="editingId === savedRamble.id" class="mxr-edit">
          <div class="hd">
            <span class="mx-lead sm"><app-icon :icon="savedRamble.has_voice ? IconMicrophone : IconNotes" :size="16" :stroke="2" /></span>
            <span class="m">
              <b>{{ $t(savedRamble.has_voice ? 'transaction.assistant_ramble_fix_transcript' : 'transaction.assistant_ramble_edit_text') }}</b>
              <small>{{ rambleMeta(savedRamble) }}</small>
            </span>
            <button
              v-if="savedRamble.has_voice"
              type="button"
              class="mx-ib sm"
              :disabled="isDisabled"
              :aria-label="$t(isPlaying(savedRamble) ? 'transaction.assistant_ramble_stop_playback' : 'transaction.assistant_ramble_play')"
              @click="toggleSavedRambleVoice(savedRamble)"
            >
              <span v-if="loadingVoiceRambleId === savedRamble.id" class="mx-spin" />
              <app-icon v-else :icon="isPlaying(savedRamble) ? IconPlayerStop : IconPlayerPlay" :size="16" :stroke="2" />
            </button>
          </div>
          <label class="mx-in ta"><textarea v-model="editingText" rows="3" :aria-label="$t('transaction.assistant_ramble_edit_text')" /></label>
          <div class="acts">
            <button type="button" class="mx-btn sm out" @click="editingId = null">{{ $t('cancel') }}</button>
            <button type="button" class="mx-btn sm pri" :disabled="isSavingEdit" @click="onSaveEdit(savedRamble)">
              <span v-if="isSavingEdit" class="mx-spin" />
              <app-icon v-else :icon="IconCheck" :size="14" :stroke="2" />
              <span>{{ $t('save') }}</span>
            </button>
          </div>
        </div>

        <div v-else class="mx-row mid mxr-row">
          <span class="mx-lead sm"><app-icon :icon="savedRamble.has_voice ? IconMicrophone : IconNotes" :size="16" :stroke="2" /></span>
          <span class="mx-row__m">
            <span class="mxr-txt wrap-anywhere">{{ savedRamble.text }}</span>
            <span class="mx-row__s">{{ rambleMeta(savedRamble) }}</span>
          </span>
          <button
            v-if="savedRamble.has_voice"
            type="button"
            class="mx-ib sm"
            :disabled="isDisabled"
            :aria-label="$t(isPlaying(savedRamble) ? 'transaction.assistant_ramble_stop_playback' : 'transaction.assistant_ramble_play')"
            @click="toggleSavedRambleVoice(savedRamble)"
          >
            <span v-if="loadingVoiceRambleId === savedRamble.id" class="mx-spin" />
            <app-icon v-else :icon="isPlaying(savedRamble) ? IconPlayerStop : IconPlayerPlay" :size="16" :stroke="2" />
          </button>
          <button type="button" class="mx-ib sm" :disabled="isDisabled" :aria-label="$t('transaction.assistant_ramble_edit_text')" @click="onEdit(savedRamble)">
            <app-icon :icon="IconPencil" :size="16" :stroke="2" />
          </button>
          <button type="button" class="mx-ib sm" :disabled="isDisabled" :aria-label="$t('delete')" @click="emit('deleteRamble', savedRamble)">
            <app-icon :icon="IconTrash" :size="16" :stroke="2" />
          </button>
        </div>
      </template>
    </div>

    <div v-else class="mx-inline-empty">
      <app-icon :icon="IconMicrophoneOff" :size="16" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_empty_saved') }}</span>
    </div>

    <button v-if="interpretCount > 0" type="button" class="mx-btn mxr-ghostbtn mxr-interp" :disabled="isDisabled" @click="onInterpret">
      <span v-if="isInterpreting" class="mx-spin" />
      <app-icon v-else :icon="IconSparkles" :size="18" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_interpret_count', interpretCount) }}</span>
    </button>
  </section>
</template>

<script setup>
import { IconArrowDown, IconCheck, IconMicrophone, IconMicrophoneOff, IconNotes, IconPencil, IconPlayerPlay, IconPlayerStop, IconSparkles, IconTrash } from '@tabler/icons-vue'
import DateUtils from '~/core/utils/DateUtils.js'

// Composer (type or dictate, then Add to rambles) + saved rambles (play, fix the text inline, delete) + Interpret (design: MX-Ramble, first two cards).
const props = defineProps({
  savedRambles: { type: Array, default: () => [] },
  isLoadingSaved: { type: Boolean, default: false },
  isAdding: { type: Boolean, default: false },
  isInterpreting: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  updateRamble: { type: Function, required: true },
})

const emit = defineEmits(['add', 'interpret', 'deleteAll', 'deleteRamble'])
const rambleText = defineModel({ type: String, default: '' })
const { t } = useI18n()

const { speechTemporary, isRecording, recordingTime, stopRecording, toggleRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice } = useRambleDictation(rambleText)
const isPlaying = (ramble) => playingVoiceRambleId.value === ramble.id

// The composer text goes along when interpreting
const interpretCount = computed(() => props.savedRambles.length + (rambleText.value.trim() ? 1 : 0))

const rambleMeta = (ramble) => [ramble.created_at && DateUtils.dateToUIWithTime(new Date(ramble.created_at)), ramble.is_edited && t('transaction.assistant_ramble_edited')].filter(Boolean).join(' · ')

const editingId = ref(null)
const editingText = ref('')
const isSavingEdit = ref(false)

const onEdit = (ramble) => {
  editingId.value = ramble.id
  editingText.value = ramble.text ?? ''
}

const onSaveEdit = async (ramble) => {
  isSavingEdit.value = true
  if (await props.updateRamble(ramble, editingText.value)) editingId.value = null
  isSavingEdit.value = false
}

const onAdd = async () => {
  stopRecording()
  await nextTick()
  emit('add')
}

const onInterpret = () => {
  stopRecording()
  emit('interpret')
}

defineExpose({ stopRecording })
</script>
