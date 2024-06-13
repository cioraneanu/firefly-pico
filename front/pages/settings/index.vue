<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <app-field-link label="App config" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_APP_CONFIG)" />

      <app-field-link label="UI preferences" :icon="TablerIconConstants.settingsUI" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_UI)" />

      <app-field-link label="Dashboard preferences" :icon="TablerIconConstants.dashboard" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_DASHBOARD)" />

      <app-field-link label="Date preferences" :icon="TablerIconConstants.settingsUserPreferencesDate" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_DATE)" />

      <app-field-link label="New transaction defaults" :icon="TablerIconConstants.settingsNewTransactionDefaults" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_NEW_TRANSACTION_DEFAULTS)" />

      <app-field-link label="Transaction config" :icon="TablerIconConstants.settingsUserPreferences" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS)" />

      <app-field-link label="About" :icon="TablerIconConstants.settingsAbout" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ABOUT)" />
    </van-cell-group>

    <div class="text-muted subtitle flex-center mt-20 flex-column">
      <div>
        <a :href="REPO_URL">Version: {{ appStore.currentAppVersion }}</a>
      </div>

      <div v-if="appStore.isNewVersionAvailable" class="latest-version-badge">
        <a :href="REPO_URL">Newer version available: {{ appStore.latestAppVersion }} 🎉</a>
      </div>
    </div>
    <div></div>
  </div>
</template>

import { ref, onMounted } from 'vue'; import { useAppStore } from '~/stores/appStore' import

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'
import { REPO_URL } from '~/constants/Constants'

import TablerIconConstants from '~/constants/TablerIconConstants'

const appStore = useAppStore()
const toolbar = useToolbar()

toolbar.init({ title: 'Settings' })

onMounted(async () => {
  await nextTick()
  animateSettings()
})
</script>
