<template>
  <div class="mx-page">
    <app-top-toolbar />

    <main class="mx-body">
      <app-card-info>
        <app-field-link :label="$t('settings.setup_entry')" :icon="IconPlugConnected" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_SETUP)" />
        <app-field-link :label="$t('settings.ui_entry')" :icon="IconPalette" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_UI)" />
        <app-field-link :label="$t('settings.assistant_entry')" :icon="IconSparkles" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ASSISTANT)" />
        <app-field-link :label="$t('settings.formatting_entry')" :icon="IconTypography" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_FORMATTING)" />
        <app-field-link :label="$t('settings.dashboard_entry')" :icon="IconLayoutDashboard" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD)" />
        <app-field-link :label="$t('settings.transactions_entry')" :icon="IconListDetails" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION)" />
        <app-field-link :label="$t('settings.about_entry')" :icon="IconInfoCircle" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ABOUT)" />
      </app-card-info>

      <app-card-info>
        <app-field-link :label="$t('settings.sync_everything')" :icon="IconRefresh" :is-link="false" @click="onSyncEverything" />
      </app-card-info>

      <div class="mx-ver">
        <img src="/logo.svg" alt="" class="size-12" />
        <a :href="REPO_URL">{{ $t('settings.version') }}: {{ appStore.currentAppVersion }}</a>
        <a v-if="appStore.isNewVersionAvailable" class="mx-pill-new" :href="REPO_URL">{{ $t('settings.new_version_available') }}: {{ appStore.latestAppVersion }} 🎉</a>
      </div>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { REPO_URL } from '~/core/constants/Constants'
import { IconInfoCircle, IconLayoutDashboard, IconListDetails, IconPalette, IconPlugConnected, IconRefresh, IconSparkles, IconTypography } from '@tabler/icons-vue'

const appStore = useAppStore()
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
