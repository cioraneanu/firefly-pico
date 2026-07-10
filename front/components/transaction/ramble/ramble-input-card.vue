<template>
  <van-cell-group inset class="no-margin overflow-hidden">
    <div class="p-2 display-flex flex-column gap-2">
      <div class="flex-center-vertical gap-2">
        <div class="flex-1-w text-size-12 text-muted">{{ $t('transaction.assistant_ramble_input_hint') }}</div>
        <van-button :type="isRecording ? 'danger' : 'primary'" size="small" round class="cursor-pointer" :disabled="isDisabled" @click="toggleRecording">
          <app-icon :icon="isRecording ? TablerIconConstants.stop : TablerIconConstants.microphone" :size="16" />
        </van-button>
      </div>

      <app-text-area
        v-model="rambleText"
        class="van-cell-no-padding compact"
        label=""
        :visible-lines="2"
        :placeholder="$t('transaction.assistant_ramble_placeholder')"
        :clearable="true"
        :disabled="isDisabled"
      />

      <div v-if="isRecording && speechTemporary" class="flex-center-vertical gap-1 text-size-12 text-muted">
        <app-icon :icon="TablerIconConstants.microphone" :size="14" />
        <span class="word-break-word">{{ speechTemporary }}</span>
      </div>

      <div class="flex-center-vertical flex-wrap gap-1">
        <van-button size="small" plain class="cursor-pointer" :loading="isLoadingSaved" :disabled="isDisabled" @click="emit('loadSaved')">
          <app-icon :icon="TablerIconConstants.list" :size="16" />
          {{ $t('transaction.assistant_ramble_load_saved') }}
          <template v-if="savedRamblesCount > 0"> ({{ savedRamblesCount }})</template>
        </van-button>

        <van-button v-if="savedRambles.length > 0" size="small" type="danger" plain class="cursor-pointer" :loading="isDeletingSaved" :disabled="isDisabled" @click="emit('deleteSaved')">
          <van-icon name="delete-o" size="16" />
          {{ $t('transaction.assistant_ramble_delete_saved') }}
        </van-button>

        <div class="flex-1" />

        <van-button size="small" type="primary" class="cursor-pointer" :loading="isInterpreting" :disabled="isDisabled || !canInterpret" @click="onInterpret">
          <app-icon :icon="TablerIconConstants.magic" :size="16" />
          {{ $t('transaction.assistant_ramble_interpret') }}
        </van-button>
      </div>
    </div>

    <div v-if="savedRambles.length > 0" class="ramble-divider">
      <div v-for="savedRamble in savedRambles" :key="savedRamble.id" class="ramble-saved-item px-2 py-1 text-size-13 word-break-word">{{ savedRamble.text }}</div>
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import * as LanguageConstants from '~/constants/LanguageConstants.js'
import { useSpeechRecognition } from '~/composables/useSpeechRecognition.js'

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

const emit = defineEmits(['interpret', 'loadSaved', 'deleteSaved'])
const rambleText = defineModel({ type: String, default: '' })

const profileStore = useProfileStore()
const speechTemporary = ref('')

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

const canInterpret = computed(() => !!rambleText.value.trim() || props.savedRambles.length > 0)

const toggleRecording = () => {
  if (props.isDisabled) {
    return
  }

  if (isRecording.value) {
    stopRecording()
    return
  }

  startRecording()
}

const onInterpret = () => {
  if (props.isDisabled) {
    return
  }

  stopRecording()
  emit('interpret')
}

defineExpose({
  stopRecording,
})
</script>
