<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-cell-group inset style="overflow: auto">
      <app-field-link label="Setup" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_SETUP)" />
      <app-field-link label="User interface" :icon="TablerIconConstants.settingsUI" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_UI)" />
      <app-field-link label="Assistant" :icon="TablerIconConstants.assistant" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ASSISTANT)" />
      <app-field-link label="Formatting" :icon="TablerIconConstants.settingsUserPreferences" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_FORMATTING)" />
      <app-field-link label="Dashboard" :icon="TablerIconConstants.dashboard" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD)" />
      <app-field-link label="Transactions" :icon="TablerIconConstants.transaction" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION)" />
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

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useToolbar } from '~/composables/useToolbar'
import { REPO_URL } from '~/constants/Constants'

import TablerIconConstants from '~/constants/TablerIconConstants'

const appStore = useAppStore()
const toolbar = useToolbar()

toolbar.init({ title: 'Settings' })

onMounted(() => {
  animateSettings()
})
</script>
