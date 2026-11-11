<template>
  <section class="mx-card mxr-card mxr-comp">
    <div class="mxr-ch">
      <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_new') }}</h2>
      <span v-if="isRecording" class="mx-rec">
        <span class="mx-wave" aria-hidden="true"><i v-for="n in 7" :key="n" /></span>
        <b>{{ $t('transaction.assistant_ramble_listening') }}</b>
      </span>
      <button
        type="button"
        class="mx-mic mxr-mic"
        :class="{ on: isRecording }"
        :disabled="isDisabled"
        :aria-pressed="isRecording"
        :aria-label="$t('transaction.assistant_ramble_listening')"
        @click="toggleRecording"
      >
        <app-icon :icon="isRecording ? IconPlayerStop : IconMicrophone" :size="18" :stroke="2" />
      </button>
    </div>
    <div class="mxr-cb">
      <textarea v-model="rambleText" rows="2" :placeholder="$t('transaction.assistant_ramble_placeholder')" :disabled="isDisabled" :aria-label="$t('transaction.assistant_ramble_new')" />
      <p v-if="isRecording && speechTemporary" class="mx-d mt-1.5 wrap-anywhere">{{ speechTemporary }}</p>
    </div>
  </section>

  <section class="mx-card mxr-card">
    <div class="mxr-ch">
      <h2 class="mx-card__t">{{ $t('transaction.assistant_ramble_saved') }}</h2>
      <span v-if="savedRamblesCount > 0" class="mx-badge">{{ savedRamblesCount }}</span>
      <button
        v-if="savedRambles.length > 0"
        type="button"
        class="mx-btn xs dng mxr-delall"
        :disabled="isDisabled || isDeletingSaved"
        :title="$t('transaction.assistant_ramble_delete_saved')"
        @click="emit('deleteSaved')"
      >
        <span v-if="isDeletingSaved" class="mx-spin" />
        <app-icon v-else :icon="IconTrash" :size="14" :stroke="2" />
        <span>{{ $t('delete') }}</span>
      </button>
    </div>

    <div v-if="isLoadingSaved" class="mx-list" aria-busy="true">
      <div v-for="n in 2" :key="n" class="mx-skrow">
        <span class="mx-sk" style="width: 28px; height: 28px; border-radius: 8px; flex: none" />
        <span class="m">
          <span class="mx-sk" style="height: 10px" />
          <span class="mx-sk" style="height: 9px; width: 45%" />
        </span>
      </div>
    </div>

    <div v-else-if="savedRambles.length > 0" class="mx-list mxr-saved">
      <div v-for="savedRamble in savedRambles" :key="savedRamble.id" class="mx-row mid mxr-row">
        <span class="mx-lead sm"><app-icon :icon="savedRamble.has_voice ? IconMicrophone : IconFileText" :size="16" :stroke="2" /></span>
        <span class="mx-row__m">
          <span class="mxr-txt wrap-anywhere">{{ savedRamble.text }}</span>
          <span class="mx-row__s">{{ formatCreatedAt(savedRamble.created_at) }}</span>
        </span>
        <button
          v-if="savedRamble.has_voice"
          type="button"
          class="mx-ib sm"
          :disabled="isDisabled"
          :aria-label="playingVoiceRambleId === savedRamble.id ? $t('transaction.assistant_ramble_stop_playback') : $t('transaction.assistant_ramble_play')"
          @click="toggleSavedRambleVoice(savedRamble)"
        >
          <span v-if="loadingVoiceRambleId === savedRamble.id" class="mx-spin" />
          <app-icon v-else :icon="playingVoiceRambleId === savedRamble.id ? IconPlayerStop : IconPlayerPlay" :size="16" :stroke="2" />
        </button>
        <button type="button" class="mx-ib sm" :disabled="isDisabled" :aria-label="$t('delete')" @click="emit('deleteRamble', savedRamble)">
          <app-icon :icon="IconTrash" :size="16" :stroke="2" />
        </button>
      </div>
    </div>

    <button v-else-if="savedRamblesCount > 0" type="button" class="mx-btn mxr-ghostbtn" :disabled="isDisabled" @click="emit('loadSaved')">
      <app-icon :icon="IconList" :size="16" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_load_saved') }}</span>
    </button>

    <div v-else class="mx-inline-empty">
      <app-icon :icon="IconMicrophoneOff" :size="16" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_no_saved') }}</span>
    </div>

    <button type="button" class="mx-btn mxr-ghostbtn mxr-interp" :disabled="isDisabled || !canInterpret" @click="onInterpret">
      <span v-if="isInterpreting" class="mx-spin" />
      <app-icon v-else :icon="IconSparkles" :size="16" :stroke="2" />
      <span>{{ $t('transaction.assistant_ramble_interpret') }}</span>
    </button>
  </section>
</template>

<script setup>
import { IconFileText, IconList, IconMicrophone, IconMicrophoneOff, IconPlayerPlay, IconPlayerStop, IconSparkles, IconTrash } from '@tabler/icons-vue'
import DateUtils from '~/core/utils/DateUtils.js'

// Composer (type or dictate) + saved rambles + Interpret (design: MX-Ramble, first two cards).
const props = defineProps({
  savedRambles: {
    type: Array,
    default: () => [],
  },
  savedRamblesCount: {
    type: Number,
    default: 0,
  },
  isLoadingSaved: {
    type: Boolean,
    default: false,
  },
  isDeletingSaved: {
    type: Boolean,
    default: false,
  },
  isInterpreting: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['interpret', 'loadSaved', 'deleteSaved', 'deleteRamble'])
const rambleText = defineModel({ type: String, default: '' })

const { speechTemporary, isRecording, stopRecording, toggleRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice } = useRambleDictation(rambleText)

const canInterpret = computed(() => !!rambleText.value.trim() || props.savedRambles.length > 0)
const formatCreatedAt = (createdAt) => (createdAt ? DateUtils.dateToUIWithTime(new Date(createdAt)) : '')

const onInterpret = () => {
  if (props.isDisabled) return
  stopRecording()
  emit('interpret')
}

defineExpose({ stopRecording })
</script>
