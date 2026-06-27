<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.general') }}:</div>

        <app-boolean v-model="autoFocusAssistant" :label="$t('settings.assistant.auto_focus')" />
        <app-field v-model="assistantTodoTagMatcher" :icon="TablerIconConstants.fieldText2" :label="$t('settings.assistant.substring_todo_tag')" :rules="[rule.required()]" required />
        <currency-select v-model="assistantCurrency" :info="$t('settings.assistant.currency')"/>
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.assistant.ramble') }}:</div>

        <app-field v-model="assistantRambleEndpoint" :icon="TablerIconConstants.external" :label="$t('settings.assistant.ramble_endpoint')" placeholder="https://api.openai.com/v1/chat/completions" />
        <app-field v-model="assistantRambleModel" :icon="TablerIconConstants.assistant" :label="$t('settings.assistant.ramble_model')" placeholder="gpt-4o-mini" />
        <app-field v-model="assistantRambleApiKey" :icon="TablerIconConstants.key" :label="$t('settings.assistant.ramble_api_key')" type="password" autocomplete="off" />
        <div class="text-size-12 text-muted px-3 pb-10">{{ $t('settings.assistant.ramble_info') }}</div>
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

const assistantTodoTagMatcher = ref('')
const assistantCurrency = ref(null)
const autoFocusAssistant = ref(false)
const assistantRambleEndpoint = ref('')
const assistantRambleModel = ref('')
const assistantRambleApiKey = ref('')

const syncedSettings = [
  { store: profileStore, path: 'autoFocusAssistant', ref: autoFocusAssistant },
  { store: profileStore, path: 'assistantTodoTagMatcher', ref: assistantTodoTagMatcher },
  { store: profileStore, path: 'assistantCurrency', ref: assistantCurrency },
  { store: profileStore, path: 'assistantRambleEndpoint', ref: assistantRambleEndpoint },
  { store: profileStore, path: 'assistantRambleModel', ref: assistantRambleModel },
  { store: profileStore, path: 'assistantRambleApiKey', ref: assistantRambleApiKey },
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
