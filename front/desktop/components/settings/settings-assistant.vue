<template>
  <d-form class="[--label-w:13.75rem]" @submit="save">
    <d-settings-group>
      <div class="grid gap-3 sm:grid-cols-2">
        <div v-for="service in services" :key="service.t" class="flex flex-col gap-3 rounded-lg p-4 ring-1 ring-fg/10">
          <div class="flex items-start justify-between gap-2">
            <div>
              <b class="font-medium">{{ $t(service.t) }}</b>
              <p class="text-[13px] text-dim">{{ $t(service.subtitle) }}</p>
            </div>
            <d-badge :variant="service.isConfigured ? 'success' : 'secondary'">{{ $t(service.isConfigured ? 'settings.assistant.llm_configured' : 'settings.assistant.llm_not_configured') }}</d-badge>
          </div>
          <dl v-if="service.isConfigured" class="flex flex-col gap-1 text-[13px]">
            <div v-for="detail in service.details" :key="detail.t" class="flex gap-2">
              <dt class="w-28 shrink-0 text-dim">{{ $t(detail.t) }}</dt>
              <dd class="truncate" :title="detail.value">{{ detail.value }}</dd>
            </div>
          </dl>
          <p v-else class="text-[13px] text-dim">{{ $t('settings.assistant.llm_not_configured_info') }}</p>
          <d-button v-if="service.isConfigured" size="sm" class="self-start" :loading="service.isTesting" @click="service.test">{{ $t(service.testLabel) }}</d-button>
        </div>
      </div>
    </d-settings-group>

    <d-settings-group :title="$t('settings.assistant.title')">
      <d-field :label="$t('settings.assistant.auto_focus')">
        <d-switch v-model="draft.autoFocusAssistant" />
      </d-field>
      <d-field :label="$t('settings.assistant.substring_todo_tag')">
        <d-input v-model="draft.assistantTodoTagMatcher" class="w-40" />
      </d-field>
      <d-field :label="$t('settings.assistant.currency')">
        <div class="max-w-80">
          <d-currency-select v-model="draft.assistantCurrency" clearable />
        </div>
      </d-field>
      <d-field :label="$t('settings.assistant.llm_context')" top>
        <d-textarea v-model="draft.assistantLlmContext" :placeholder="$t('settings.assistant.llm_context_placeholder')" />
      </d-field>
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @reset="reset" />
  </d-form>
</template>

<script setup>
import AssistantRepository from '~/core/repository/AssistantRepository'

const { t } = useI18n()
const appStore = useAppStore()
const testing = reactive({ llm: false, transcription: false })

const { draft, save, reset, isSaving } = useSettingsDraft(['autoFocusAssistant', 'assistantTodoTagMatcher', 'assistantCurrency', 'assistantLlmContext'])

const runTest = async (key, request, success, failure) => {
  testing[key] = true
  const response = await request()
  testing[key] = false
  if (ResponseUtils.isSuccess(response)) return UIUtils.showToastSuccess(t(success))
  UIUtils.showToastError(response?.data?.message ?? t(failure))
}

const services = computed(() => [
  {
    t: 'settings.assistant.llm_status',
    subtitle: 'settings.assistant.llm_status_subtitle',
    isConfigured: appStore.llmIsConfigured,
    details: [
      { t: 'settings.assistant.ramble_endpoint', value: appStore.llmEndpoint },
      { t: 'settings.assistant.ramble_model', value: appStore.llmModel },
    ],
    testLabel: 'settings.assistant.llm_test',
    isTesting: testing.llm,
    test: () => runTest('llm', () => new AssistantRepository().testLlm(), 'settings.assistant.llm_test_success', 'settings.assistant.llm_test_failed'),
  },
  {
    t: 'settings.assistant.transcription_status',
    subtitle: 'settings.assistant.transcription_status_subtitle',
    isConfigured: appStore.transcriptionIsConfigured,
    details: [
      { t: 'settings.assistant.transcription_endpoint', value: appStore.transcriptionEndpoint },
      { t: 'settings.assistant.transcription_model', value: appStore.transcriptionModel },
      { t: 'settings.assistant.transcription_language', value: appStore.transcriptionLanguage ?? t('settings.assistant.transcription_language_auto') },
    ],
    testLabel: 'settings.assistant.transcription_test',
    isTesting: testing.transcription,
    test: () => runTest('transcription', () => new AssistantRepository().testTranscription(), 'settings.assistant.transcription_test_success', 'settings.assistant.transcription_test_failed'),
  },
])
</script>
