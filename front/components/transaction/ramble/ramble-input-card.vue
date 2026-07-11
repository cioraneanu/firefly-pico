<template>
  <van-cell-group inset class="ramble-composer no-margin overflow-hidden">
    <div class="p-3 display-flex flex-column gap-2">
      <div class="flex-center-vertical flex-wrap gap-2">
        <van-badge :content="savedRamblesCount" :show-zero="false" max="99" class="ramble-modern-badge">
          <van-button round size="small" plain class="cursor-pointer" :loading="isLoadingSaved" :disabled="isDisabled" @click="emit('loadSaved')">
            <app-icon :icon="TablerIconConstants.list" :size="16" />
            {{ $t('transaction.assistant_ramble_load_saved') }}
          </van-button>
        </van-badge>

        <van-button
          v-if="savedRambles.length > 0"
          round
          size="small"
          type="danger"
          plain
          class="cursor-pointer"
          :loading="isDeletingSaved"
          :disabled="isDisabled"
          :title="$t('transaction.assistant_ramble_delete_saved')"
          @click="emit('deleteSaved')"
        >
          <van-icon name="delete-o" size="16" />
          {{ $t('delete') }}
        </van-button>

        <div class="flex-1" />

        <van-button
          v-if="appStore.isDesktopLayout"
          round
          size="small"
          :type="isRecording ? 'danger' : 'default'"
          class="cursor-pointer ramble-icon-button"
          :class="{ 'ramble-recording': isRecording }"
          :disabled="isDisabled"
          @click="toggleRecording"
        >
          <app-icon :icon="isRecording ? TablerIconConstants.stop : TablerIconConstants.microphone" :size="16" />
        </van-button>

        <speech-language-dropdown v-if="appStore.isDesktopLayout" v-model="speechLanguageCode" class="text-size-13" />
      </div>

      <div v-if="savedRambles.length > 0" class="ramble-saved-list display-flex flex-column gap-2">
        <div v-for="savedRamble in savedRambles" :key="savedRamble.id" class="ramble-saved-item display-flex gap-2">
          <div class="flex-1-w">
            <div class="text-size-13 word-break-word">{{ savedRamble.text }}</div>
            <div class="text-size-11 text-muted mt-1">{{ formatCreatedAt(savedRamble.created_at) }}</div>
          </div>
          <van-button round size="small" plain type="danger" class="cursor-pointer ramble-icon-button" :disabled="isDisabled" :title="$t('delete')" @click="emit('deleteRamble', savedRamble)">
            <van-icon name="delete-o" size="15" />
          </van-button>
        </div>
      </div>

      <app-text-area
        v-model="rambleText"
        class="van-cell-no-padding compact ramble-composer-input"
        label=""
        :visible-lines="2"
        :placeholder="$t('transaction.assistant_ramble_placeholder')"
        :clearable="true"
        :disabled="isDisabled"
      />

      <div v-if="isRecording" class="flex-center-vertical gap-2 text-size-12">
        <span class="ramble-live-dot" />
        <span class="word-break-word flex-1-w text-muted">{{ speechTemporary || $t('transaction.assistant_ramble_listening') }}</span>
      </div>

      <van-button block round class="cursor-pointer mt-1 ramble-interpret-button" :loading="isInterpreting" :disabled="isDisabled || !canInterpret" @click="onInterpret">
        <app-icon :icon="TablerIconConstants.magic" :size="16" />
        {{ $t('transaction.assistant_ramble_interpret') }}
      </van-button>
    </div>
  </van-cell-group>
</template>

<script setup>
import { useLocalStorage } from '@vueuse/core'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import * as LanguageConstants from '~/constants/LanguageConstants.js'
import SpeechLanguageDropdown from '~/components/select/speech-language-dropdown.vue'
import { useSpeechRecognition } from '~/composables/useSpeechRecognition.js'
import DateUtils from '~/utils/DateUtils.js'

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

const profileStore = useProfileStore()
const appStore = useAppStore()
const speechTemporary = ref('')

// The app UI language is only the initial default. The dropdown selection is remembered per browser.
const defaultSpeechLanguageCode = () => {
  const languageMap = {
    en: LanguageConstants.LANGUAGE_ENGLISH,
    ro: LanguageConstants.LANGUAGE_ROMANIAN,
    pl: LanguageConstants.LANGUAGE_POLISH,
    it: LanguageConstants.LANGUAGE_ITALIAN,
    'ru-RU': LanguageConstants.LANGUAGE_RUSSIAN,
    'fr-FR': LanguageConstants.LANGUAGE_FRENCH,
    'de-DE': LanguageConstants.LANGUAGE_GERMAN,
    'de-CH': LanguageConstants.LANGUAGE_GERMAN,
    'es-MX': LanguageConstants.LANGUAGE_SPANISH_MX,
    'pt-BR': LanguageConstants.LANGUAGE_PORTUGUESE_BR,
    'zh-CN': LanguageConstants.LANGUAGE_CHINESE,
  }

  return languageMap[profileStore.language] ?? LanguageConstants.LANGUAGE_ENGLISH
}

const speechLanguageCode = useLocalStorage('rambleSpeechLanguage', defaultSpeechLanguageCode())
const speechLanguage = computed(() => ({ code: speechLanguageCode.value }))

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
const formatCreatedAt = (createdAt) => (createdAt ? DateUtils.dateToUIWithTime(new Date(createdAt)) : '')

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
