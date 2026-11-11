<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card :section="$t('settings.general')">
          <app-boolean v-model="autoFocusAssistant" :label="$t('settings.assistant.auto_focus')" />
          <div class="mx-hr" />
          <app-field v-model="assistantTodoTagMatcher" name="assistantTodoTagMatcher" :label="$t('settings.assistant.substring_todo_tag')" :rules="[rule.required()]" />
          <currency-select v-model="assistantCurrency" :info="$t('settings.assistant.currency')" />
        </app-card>

        <app-card :title="$t('settings.assistant.llm_status')" :description="$t('settings.assistant.llm_status_subtitle')" :form="false">
          <template #actions>
            <span v-if="appStore.llmIsConfigured" class="mx-pill-ok">{{ $t('settings.assistant.llm_configured') }}</span>
            <span v-else class="mx-chip warn">{{ $t('settings.assistant.llm_not_configured') }}</span>
          </template>

          <div v-if="appStore.llmIsConfigured" class="mx-kv">
            <div @click="showFullDetailValue(appStore.llmEndpoint)">
              <span>{{ $t('settings.assistant.ramble_endpoint') }}</span>
              <b>{{ appStore.llmEndpoint }}</b>
            </div>
            <div @click="showFullDetailValue(appStore.llmModel)">
              <span>{{ $t('settings.assistant.ramble_model') }}</span>
              <b>{{ appStore.llmModel }}</b>
            </div>
          </div>
          <template v-else>
            <div class="mx-note">
              <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.llm_not_configured_info') }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2.5">
              <span v-for="name in llmEnvVariables" :key="name" class="mx-chip font-mono">{{ name }}</span>
            </div>
          </template>

          <div class="mx-hr my-3.5" />

          <app-text-area v-model="assistantLlmContext" :label="$t('settings.assistant.llm_context')" :placeholder="$t('settings.assistant.llm_context_placeholder')" :visible-lines="3" />

          <button v-if="appStore.llmIsConfigured" type="button" class="mx-btn out block mt-3" :disabled="isTestingLlm" @click="testLlm">
            <span v-if="isTestingLlm" class="mx-spin" />
            <app-icon v-else :icon="IconPlugConnected" :size="16" :stroke="2" />
            <span>{{ $t('settings.assistant.llm_test') }}</span>
          </button>
        </app-card>

        <app-card :title="$t('settings.assistant.transcription_status')" :description="$t('settings.assistant.transcription_status_subtitle')" :form="false">
          <template #actions>
            <span v-if="appStore.transcriptionIsConfigured" class="mx-pill-ok">{{ $t('settings.assistant.llm_configured') }}</span>
            <span v-else class="mx-chip warn">{{ $t('settings.assistant.llm_not_configured') }}</span>
          </template>

          <template v-if="appStore.transcriptionIsConfigured">
            <div class="mx-kv">
              <div @click="showFullDetailValue(appStore.transcriptionEndpoint)">
                <span>{{ $t('settings.assistant.transcription_endpoint') }}</span>
                <b>{{ appStore.transcriptionEndpoint }}</b>
              </div>
              <div @click="showFullDetailValue(appStore.transcriptionModel)">
                <span>{{ $t('settings.assistant.transcription_model') }}</span>
                <b>{{ appStore.transcriptionModel }}</b>
              </div>
              <div>
                <span>{{ $t('settings.assistant.transcription_language') }}</span>
                <b>{{ appStore.transcriptionLanguage || $t('settings.assistant.transcription_language_auto') }}</b>
              </div>
            </div>

            <div v-if="!appStore.transcriptionLanguage" class="mx-note mt-3">
              <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.transcription_language_info') }}</span>
            </div>

            <button type="button" class="mx-btn out block mt-3" :disabled="isTestingTranscription" @click="testTranscription">
              <span v-if="isTestingTranscription" class="mx-spin" />
              <app-icon v-else :icon="IconMicrophone" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.transcription_test') }}</span>
            </button>
          </template>
          <template v-else>
            <div class="mx-note">
              <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
              <span>{{ $t('settings.assistant.llm_not_configured_info') }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2.5">
              <span v-for="name in transcriptionEnvVariables" :key="name" class="mx-chip font-mono">{{ name }}</span>
            </div>
          </template>
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { IconInfoCircle, IconMicrophone, IconPlugConnected } from '@tabler/icons-vue'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { rule } from '~/core/utils/ValidationUtils.js'
import AssistantRepository from '~/core/repository/AssistantRepository.js'

const { t } = useI18n()
const profileStore = useProfileStore()
const appStore = useAppStore()

const assistantTodoTagMatcher = ref('')
const assistantCurrency = ref(null)
const autoFocusAssistant = ref(false)
const assistantLlmContext = ref('')
const isTestingLlm = ref(false)
const isTestingTranscription = ref(false)

const llmEnvVariables = ['ASSISTANT_LLM_ENDPOINT', 'ASSISTANT_LLM_MODEL', 'ASSISTANT_LLM_API_KEY', 'ASSISTANT_LLM_CONTEXT']
const transcriptionEnvVariables = ['ASSISTANT_TRANSCRIPTION_ENDPOINT', 'ASSISTANT_TRANSCRIPTION_MODEL', 'ASSISTANT_TRANSCRIPTION_API_KEY', 'ASSISTANT_TRANSCRIPTION_LANGUAGE']

const syncedSettings = [
  { store: profileStore, path: 'autoFocusAssistant', ref: autoFocusAssistant },
  { store: profileStore, path: 'assistantTodoTagMatcher', ref: assistantTodoTagMatcher },
  { store: profileStore, path: 'assistantCurrency', ref: assistantCurrency },
  { store: profileStore, path: 'assistantLlmContext', ref: assistantLlmContext },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
}

// The values are truncated; a tap shows the full value.
const showFullDetailValue = (value) => {
  if (!value) {
    return
  }

  UIUtils.showToast(value, 'primary', 3000)
}

const testLlm = async () => {
  isTestingLlm.value = true
  const response = await new AssistantRepository().testLlm()
  isTestingLlm.value = false

  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.assistant.llm_test_success'))
    return
  }

  UIUtils.showToastError(response?.data?.message ?? t('settings.assistant.llm_test_failed'))
}

const testTranscription = async () => {
  isTestingTranscription.value = true
  const response = await new AssistantRepository().testTranscription()
  isTestingTranscription.value = false

  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.assistant.transcription_test_success'))
    return
  }

  UIUtils.showToastError(response?.data?.message ?? t('settings.assistant.transcription_test_failed'))
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.assistant.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
