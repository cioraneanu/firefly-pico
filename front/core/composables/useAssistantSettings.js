import { get } from 'lodash-es'
import AssistantRepository from '~/core/repository/AssistantRepository'

// The user's assistant connections (Settings · Assistant, both apps). Each group — llm and transcription — either
// uses the server's ASSISTANT_* environment variables or the user's own endpoint + key + model, all together.
// API keys are write-only: the server only says whether one is saved; typing a new key replaces it, clearApiKey removes it on save.
const emptyDraft = () => ({
  llmUseOwn: false,
  llmEndpoint: '',
  llmModel: '',
  llmApiKey: '',
  llmHasApiKey: false,
  transcriptionUseOwn: false,
  transcriptionEndpoint: '',
  transcriptionModel: '',
  transcriptionApiKey: '',
  transcriptionHasApiKey: false,
  transcriptionLanguage: '',
})

export function useAssistantSettings() {
  const { t } = useI18n()
  const appStore = useAppStore()
  const repository = new AssistantRepository()

  const draft = ref(emptyDraft())
  const server = ref({ llm: appStore.llm ?? null, transcription: appStore.transcription ?? null })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const testing = reactive({ llm: false, transcription: false })

  const apply = (data) => {
    draft.value = {
      llmUseOwn: !!get(data, 'llm_use_own'),
      llmEndpoint: get(data, 'llm_endpoint') ?? '',
      llmModel: get(data, 'llm_model') ?? '',
      llmApiKey: '',
      llmHasApiKey: !!get(data, 'llm_has_api_key'),
      transcriptionUseOwn: !!get(data, 'transcription_use_own'),
      transcriptionEndpoint: get(data, 'transcription_endpoint') ?? '',
      transcriptionModel: get(data, 'transcription_model') ?? '',
      transcriptionApiKey: '',
      transcriptionHasApiKey: !!get(data, 'transcription_has_api_key'),
      transcriptionLanguage: get(data, 'transcription_language') ?? '',
    }
    server.value = get(data, 'server') ?? server.value
  }

  const load = async () => {
    isLoading.value = true
    const response = await repository.getSettings()
    isLoading.value = false
    if (ResponseUtils.isSuccess(response)) {
      apply(get(response, 'data.data'))
    }
  }

  // A group whose draft shows no saved key and no typed key has no key: clearApiKey got it there
  const isKeyCleared = (group) => !draft.value[`${group}HasApiKey`] && !draft.value[`${group}ApiKey`]
  const clearApiKey = (group) => Object.assign(draft.value, { [`${group}ApiKey`]: '', [`${group}HasApiKey`]: false })

  const toPayload = () => ({
    llm_use_own: draft.value.llmUseOwn,
    llm_endpoint: draft.value.llmEndpoint || null,
    llm_model: draft.value.llmModel || null,
    llm_api_key: draft.value.llmApiKey || null,
    llm_api_key_clear: isKeyCleared('llm'),
    transcription_use_own: draft.value.transcriptionUseOwn,
    transcription_endpoint: draft.value.transcriptionEndpoint || null,
    transcription_model: draft.value.transcriptionModel || null,
    transcription_api_key: draft.value.transcriptionApiKey || null,
    transcription_api_key_clear: isKeyCleared('transcription'),
    transcription_language: draft.value.transcriptionLanguage || null,
  })

  const save = async () => {
    isSaving.value = true
    const response = await repository.updateSettings(toPayload())
    isSaving.value = false
    if (!ResponseUtils.isSuccess(response)) {
      UIUtils.showToastError(get(response, 'data.message') ?? t('settings.assistant.connection_save_failed'))
      return false
    }
    apply(get(response, 'data.data'))
    return true
  }

  // Unsaved values, so tests and "Try it out" use what is on the screen
  const llmOverride = computed(() => ({ use_own: draft.value.llmUseOwn, endpoint: draft.value.llmEndpoint, model: draft.value.llmModel, api_key: draft.value.llmApiKey }))
  const transcriptionOverride = computed(() => ({
    use_own: draft.value.transcriptionUseOwn,
    endpoint: draft.value.transcriptionEndpoint,
    model: draft.value.transcriptionModel,
    api_key: draft.value.transcriptionApiKey,
    language: draft.value.transcriptionLanguage,
  }))

  // 'own' | 'server' | 'none' (server selected but not configured)
  const sourceOf = (useOwn, serverConfig) => (useOwn ? 'own' : get(serverConfig, 'is_configured') ? 'server' : 'none')
  const llmSource = computed(() => sourceOf(draft.value.llmUseOwn, server.value.llm))
  const transcriptionSource = computed(() => sourceOf(draft.value.transcriptionUseOwn, server.value.transcription))
  const llmModelInUse = computed(() => (draft.value.llmUseOwn ? draft.value.llmModel || 'gpt-4o-mini' : get(server.value.llm, 'model')))

  const runTest = async (key, request, success, failure) => {
    testing[key] = true
    const response = await request()
    testing[key] = false
    if (ResponseUtils.isSuccess(response)) {
      UIUtils.showToastSuccess(t(success))
      return
    }
    UIUtils.showToastError(get(response, 'data.message') ?? t(failure))
  }

  const testLlm = () => runTest('llm', () => repository.testLlm(llmOverride.value), 'settings.assistant.llm_test_success', 'settings.assistant.llm_test_failed')
  const testTranscription = () =>
    runTest('transcription', () => repository.testTranscription(transcriptionOverride.value), 'settings.assistant.transcription_test_success', 'settings.assistant.transcription_test_failed')

  return {
    draft,
    server,
    isLoading,
    isSaving,
    testing,
    load,
    save,
    clearApiKey,
    llmOverride,
    transcriptionOverride,
    llmSource,
    transcriptionSource,
    llmModelInUse,
    testLlm,
    testTranscription,
  }
}
