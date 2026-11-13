import { useLocalStorage, useNow } from '@vueuse/core'
import * as LanguageConstants from '~/core/constants/LanguageConstants'
import AssistantRepository from '~/core/repository/AssistantRepository'

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
  el: LanguageConstants.LANGUAGE_GREEK,
}

export function useRambleDictation(rambleText) {
  const profileStore = useProfileStore()
  const assistantRepository = new AssistantRepository()
  const speechTemporary = ref('')
  const speechLanguageCode = useLocalStorage('rambleSpeechLanguage', languageMap[profileStore.language] ?? LanguageConstants.LANGUAGE_ENGLISH)
  const speechLanguage = computed(() => ({ code: speechLanguageCode.value }))

  const appendDictatedText = (text) => {
    text = (text ?? '').trim()
    if (text) rambleText.value = [rambleText.value.trim(), text].filter(Boolean).join(' ')
  }

  const { startRecording, stopRecording, isRecording } = useSpeechRecognition({
    language: speechLanguage,
    continuous: true,
    interimResults: true,
    onSpeechFinished: appendDictatedText,
    onSpeechTemporary: (text) => (speechTemporary.value = text),
  })

  const toggleRecording = () => (isRecording.value ? stopRecording() : startRecording())

  // Elapsed recording time as m:ss
  const now = useNow({ interval: 1000 })
  const recordingStartedAt = ref(0)
  watch(isRecording, (value) => (recordingStartedAt.value = value ? Date.now() : 0))
  const recordingTime = computed(() => {
    const seconds = recordingStartedAt.value ? Math.max(0, Math.floor((now.value - recordingStartedAt.value) / 1000)) : 0
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  })

  const playingVoiceRambleId = ref(null)
  const loadingVoiceRambleId = ref(null)
  let voiceAudio = null
  let voiceObjectUrl = null

  const stopSavedRambleVoice = () => {
    voiceAudio?.pause()
    voiceAudio = null
    if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl)
    voiceObjectUrl = null
    playingVoiceRambleId.value = null
  }

  const toggleSavedRambleVoice = async (savedRamble) => {
    if (playingVoiceRambleId.value === savedRamble.id) return stopSavedRambleVoice()

    stopSavedRambleVoice()
    loadingVoiceRambleId.value = savedRamble.id
    try {
      const voiceBlob = await assistantRepository.getSavedRambleVoice(savedRamble.id)
      if (loadingVoiceRambleId.value !== savedRamble.id || !voiceBlob) return
      voiceObjectUrl = URL.createObjectURL(voiceBlob)
      voiceAudio = new Audio(voiceObjectUrl)
      voiceAudio.onended = stopSavedRambleVoice
      playingVoiceRambleId.value = savedRamble.id
      await voiceAudio.play()
    } catch {
      stopSavedRambleVoice()
    } finally {
      if (loadingVoiceRambleId.value === savedRamble.id) loadingVoiceRambleId.value = null
    }
  }

  onBeforeUnmount(() => {
    stopSavedRambleVoice()
    stopRecording()
  })

  return { speechTemporary, speechLanguageCode, isRecording, recordingTime, startRecording, stopRecording, toggleRecording, playingVoiceRambleId, loadingVoiceRambleId, toggleSavedRambleVoice }
}
