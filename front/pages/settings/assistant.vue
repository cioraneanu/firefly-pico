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
        <div class="van-cell-group-title">{{ $t('settings.assistant.llm_status') }}:</div>
        <div class="p-3 pt-0 display-flex flex-column gap-2">
          <div class="flex-center-vertical gap-2">
            <div class="icon-type" :class="appStore.llmIsConfigured ? 'color-income' : 'color-expense'" />
            <div class="font-600 text-size-14">{{ appStore.llmIsConfigured ? $t('settings.assistant.llm_configured') : $t('settings.assistant.llm_not_configured') }}</div>
          </div>

          <template v-if="appStore.llmIsConfigured">
            <div class="flex-center-vertical gap-1 text-size-13">
              <app-icon :icon="TablerIconConstants.external" :size="16" />
              <span class="text-muted">{{ $t('settings.assistant.ramble_endpoint') }}:</span>
              <span class="word-break-word">{{ appStore.llmEndpoint }}</span>
            </div>
            <div class="flex-center-vertical gap-1 text-size-13">
              <app-icon :icon="TablerIconConstants.magic" :size="16" />
              <span class="text-muted">{{ $t('settings.assistant.ramble_model') }}:</span>
              <span class="word-break-word">{{ appStore.llmModel }}</span>
            </div>
          </template>

          <template v-else>
            <div class="text-size-13 text-muted">{{ $t('settings.assistant.llm_not_configured_info') }}</div>
            <div class="text-size-12 gap-1 display-flex flex-wrap">
              <div class="tag-gray">ASSISTANT_LLM_ENDPOINT</div>
              <div class="tag-gray">ASSISTANT_LLM_MODEL</div>
              <div class="tag-gray">ASSISTANT_LLM_API_KEY</div>
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

const { t } = useI18n()
const profileStore = useProfileStore()
const appStore = useAppStore()

const assistantTodoTagMatcher = ref('')
const assistantCurrency = ref(null)
const autoFocusAssistant = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'autoFocusAssistant', ref: autoFocusAssistant },
  { store: profileStore, path: 'assistantTodoTagMatcher', ref: assistantTodoTagMatcher },
  { store: profileStore, path: 'assistantCurrency', ref: assistantCurrency },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
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
