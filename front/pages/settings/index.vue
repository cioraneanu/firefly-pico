<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <app-field-link :label="$t('settings.setup_entry')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_SETUP)" />
      <app-field-link :label="$t('settings.ui_entry')" :icon="TablerIconConstants.settingsUI" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_UI)" />
      <app-field-link :label="$t('settings.assistant_entry')" :icon="TablerIconConstants.assistant" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ASSISTANT)" />
      <app-field-link :label="$t('settings.formatting_entry')" :icon="TablerIconConstants.fieldText1" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_FORMATTING)" />
      <app-field-link :label="$t('settings.dashboard_entry')" :icon="TablerIconConstants.dashboard" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD)" />
      <app-field-link :label="$t('settings.transactions_entry')" :icon="TablerIconConstants.transaction" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION)" />
      <app-field-link :label="$t('settings.about_entry')" :icon="TablerIconConstants.settingsAbout" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ABOUT)" />
    </van-cell-group>

    <div class="text-muted subtitle flex-center mt-20 flex-column">
      <div>
        <a :href="REPO_URL">{{$t('settings.version')}}: {{ appStore.currentAppVersion }}</a>
      </div>

      <div v-if="appStore.isNewVersionAvailable" class="latest-version-badge">
        <a :href="REPO_URL">{{$t('settings.new_version_available')}}: {{ appStore.latestAppVersion }} 🎉</a>
      </div>
    </div>
    <div></div>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'
import { REPO_URL } from '~/constants/Constants'

import TablerIconConstants from '~/constants/TablerIconConstants'

const appStore = useAppStore()
const toolbar = useToolbar()

const { t } = useI18n()
toolbar.init({ title: t('settings.settings_title') })

onMounted(() => {
  animateSettings()
})
</script>
