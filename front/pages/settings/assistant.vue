<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.general') }}:</div>

        <app-boolean v-model="autoFocusAssistant" :label="$t('settings.assistant.auto_focus')" />
        <app-field v-model="assistantTodoTagMatcher" :icon="TablerIconConstants.fieldText2" :label="$t('settings.assistant.substring_todo_tag')" :rules="[rule.required()]" required />
        <currency-select v-model="assistantCurrency" :info="$t('settings.assistant.currency')" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="p-3 display-flex flex-column gap-3">
          <div class="flex-center-vertical gap-2">
            <div class="ramble-header-icon flex-center">
              <app-icon :icon="TablerIconConstants.ramble" :size="20" :stroke="1.6" />
            </div>
            <div class="flex-1-w">
              <div class="font-600 text-size-14 line-height-normal">{{ $t('settings.assistant.llm_status') }}</div>
              <div class="text-size-12 text-muted">{{ $t('settings.assistant.llm_status_subtitle') }}</div>
            </div>
          </div>
          <div class="display-flex">
            <div class="llm-status-pill" :class="appStore.llmIsConfigured ? 'llm-status-pill-on' : 'llm-status-pill-off'">
              <span class="llm-status-dot" />
              {{ appStore.llmIsConfigured ? $t('settings.assistant.llm_configured') : $t('settings.assistant.llm_not_configured') }}
            </div>
          </div>
          <div v-if="appStore.llmIsConfigured" class="llm-detail-panel">
            <div class="llm-detail-row">
              <app-icon :icon="TablerIconConstants.external" :size="16" />
              <span class="llm-detail-label text-muted">{{ $t('settings.assistant.ramble_endpoint') }}</span>
              <span class="llm-detail-value cursor-pointer" :title="appStore.llmEndpoint" @click="showFullDetailValue(appStore.llmEndpoint)">{{ appStore.llmEndpoint }}</span>
            </div>
            <div class="llm-detail-row">
              <app-icon :icon="TablerIconConstants.magic" :size="16" />
              <span class="llm-detail-label text-muted">{{ $t('settings.assistant.ramble_model') }}</span>
              <span class="llm-detail-value cursor-pointer" :title="appStore.llmModel" @click="showFullDetailValue(appStore.llmModel)">{{ appStore.llmModel }}</span>
            </div>
          </div>

          <app-text-area v-model="assistantLlmContext" class="assistant-llm-context" :label="$t('settings.assistant.llm_context')" :placeholder="$t('settings.assistant.llm_context_placeholder')" :visible-lines="2" />

          <div v-if="appStore.llmIsConfigured" class="flex-center">
            <van-button round size="small" plain :loading="isTestingLlm" @click="testLlm">
              <app-icon :icon="TablerIconConstants.magic" :size="16" />
              {{ $t('settings.assistant.llm_test') }}
            </van-button>
          </div>

          <template v-else>
            <div class="text-size-13 text-muted">{{ $t('settings.assistant.llm_not_configured_info') }}</div>
            <div class="display-flex flex-wrap gap-1">
              <div class="llm-env-chip">ASSISTANT_LLM_ENDPOINT</div>
              <div class="llm-env-chip">ASSISTANT_LLM_MODEL</div>
              <div class="llm-env-chip">ASSISTANT_LLM_API_KEY</div>
              <div class="llm-env-chip">ASSISTANT_LLM_CONTEXT</div>
            </div>
          </template>
        </div>
      </van-cell-group>

      <van-cell-group inset>
        <div class="p-3 display-flex flex-column gap-3">
          <div class="flex-center-vertical gap-2">
            <div class="ramble-header-icon flex-center">
              <app-icon :icon="TablerIconConstants.microphone" :size="20" :stroke="1.6" />
            </div>
            <div class="flex-1-w">
              <div class="font-600 text-size-14 line-height-normal">{{ $t('settings.assistant.transcription_status') }}</div>
              <div class="text-size-12 text-muted">{{ $t('settings.assistant.transcription_status_subtitle') }}</div>
            </div>
          </div>
          <div class="display-flex">
            <div class="llm-status-pill" :class="appStore.transcriptionIsConfigured ? 'llm-status-pill-on' : 'llm-status-pill-off'">
              <span class="llm-status-dot" />
              {{ appStore.transcriptionIsConfigured ? $t('settings.assistant.llm_configured') : $t('settings.assistant.llm_not_configured') }}
            </div>
          </div>
          <div v-if="appStore.transcriptionIsConfigured" class="llm-detail-panel">
            <div class="llm-detail-row">
              <app-icon :icon="TablerIconConstants.external" :size="16" />
              <span class="llm-detail-label text-muted">{{ $t('settings.assistant.transcription_endpoint') }}</span>
              <span class="llm-detail-value cursor-pointer" :title="appStore.transcriptionEndpoint" @click="showFullDetailValue(appStore.transcriptionEndpoint)">{{ appStore.transcriptionEndpoint }}</span>
            </div>
            <div class="llm-detail-row">
              <app-icon :icon="TablerIconConstants.magic" :size="16" />
              <span class="llm-detail-label text-muted">{{ $t('settings.assistant.transcription_model') }}</span>
              <span class="llm-detail-value cursor-pointer" :title="appStore.transcriptionModel" @click="showFullDetailValue(appStore.transcriptionModel)">{{ appStore.transcriptionModel }}</span>
            </div>
            <div class="llm-detail-row">
              <app-icon :icon="TablerIconConstants.language" :size="16" />
              <span class="llm-detail-label text-muted">{{ $t('settings.assistant.transcription_language') }}</span>
              <span class="llm-detail-value">{{ appStore.transcriptionLanguage || $t('settings.assistant.transcription_language_auto') }}</span>
            </div>
          </div>

          <app-boolean v-if="appStore.transcriptionIsConfigured" v-model="useExternalStt" :label="$t('settings.assistant.use_external_stt')" />
          <div v-if="appStore.transcriptionIsConfigured && useExternalStt" class="text-size-12 text-muted">{{ $t('settings.assistant.use_external_stt_info') }}</div>

          <div v-if="appStore.transcriptionIsConfigured && !appStore.transcriptionLanguage" class="text-size-12 text-muted">{{ $t('settings.assistant.transcription_language_info') }}</div>

          <div v-if="appStore.transcriptionIsConfigured" class="flex-center">
            <van-button round size="small" plain :loading="isTestingTranscription" @click="testTranscription">
              <app-icon :icon="TablerIconConstants.microphone" :size="16" />
              {{ $t('settings.assistant.transcription_test') }}
            </van-button>
          </div>

          <template v-else>
            <div class="text-size-13 text-muted">{{ $t('settings.assistant.llm_not_configured_info') }}</div>
            <div class="display-flex flex-wrap gap-1">
              <div class="llm-env-chip">ASSISTANT_TRANSCRIPTION_ENDPOINT</div>
              <div class="llm-env-chip">ASSISTANT_TRANSCRIPTION_MODEL</div>
              <div class="llm-env-chip">ASSISTANT_TRANSCRIPTION_API_KEY</div>
              <div class="llm-env-chip">ASSISTANT_TRANSCRIPTION_LANGUAGE</div>
            </div>
          </template>
        </div>
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import { rule } from '~/utils/ValidationUtils.js'
import AssistantRepository from '~/repository/AssistantRepository.js'

const { t } = useI18n()
const profileStore = useProfileStore()
const appStore = useAppStore()

const assistantTodoTagMatcher = ref('')
const assistantCurrency = ref(null)
const autoFocusAssistant = ref(false)
const assistantLlmContext = ref('')
const useExternalStt = ref(false)
const isTestingLlm = ref(false)
const isTestingTranscription = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'autoFocusAssistant', ref: autoFocusAssistant },
  { store: profileStore, path: 'assistantTodoTagMatcher', ref: assistantTodoTagMatcher },
  { store: profileStore, path: 'assistantCurrency', ref: assistantCurrency },
  { store: profileStore, path: 'assistantLlmContext', ref: assistantLlmContext },
  { store: profileStore, path: 'useExternalStt', ref: useExternalStt },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
}

// Desktop gets the native title tooltip on hover; on mobile a tap shows the full value.
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
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
