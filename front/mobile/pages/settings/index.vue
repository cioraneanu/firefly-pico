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


    <van-cell-group inset style="overflow: auto">
      <app-field-link label="Sync everything" :icon="TablerIconConstants.lastSync" :is-link="false" @click="onSyncEverything" />
    </van-cell-group>



    <div class="text-muted subtitle flex items-center justify-center mt-5 flex-col">
      <img src="/logo.svg" alt="" class="size-12 mb-2">
      <div>
        <a :href="REPO_URL">{{$t('settings.version')}}: {{ appStore.currentAppVersion }}</a>
      </div>

      <div v-if="appStore.isNewVersionAvailable" class="latest-version-badge">
        <a :href="REPO_URL">{{$t('settings.new_version_available')}}: {{ appStore.latestAppVersion }} 🎉</a>
      </div>
    </div>
    <div/>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { REPO_URL } from '~/core/constants/Constants'

import TablerIconConstants from '~/core/constants/TablerIconConstants'
import UIUtils from '~/core/utils/UIUtils.js'
import { useDashboardStore } from '~/core/stores/dashboardStore'

const appStore = useAppStore()
const dashboardStore = useDashboardStore()
const toolbar = useToolbar()

const { t } = useI18n()
toolbar.init({ title: t('settings.settings_title') })


const onSyncEverything = async () => {
  await appStore.syncEverything()
}

onMounted(() => {
  animateSettings()
})
</script>
