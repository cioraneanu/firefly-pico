<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <app-boolean v-model="budgetsEnabled" :label="$t('settings.setup.enable_budgets')" />
        <app-boolean v-model="categoriesEnabled" :label="$t('settings.setup.enable_categories')" />
        <app-boolean v-model="tagsEnabled" :label="$t('settings.setup.enable_tags')" />
        <app-boolean v-model="piggyBanksEnabled" :label="$t('settings.setup.enable_piggy_banks')" />
        <app-boolean v-model="recurringTransactionsEnabled" :label="$t('settings.setup.enable_recurring_transactions')" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import { useAppStore } from '~/core/stores/appStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'

const { t } = useI18n()
const profileStore = useProfileStore()
const appStore = useAppStore()

const budgetsEnabled = ref(true)
const categoriesEnabled = ref(true)
const tagsEnabled = ref(true)
const piggyBanksEnabled = ref(true)
const recurringTransactionsEnabled = ref(true)

const syncedSettings = [
  { store: profileStore, path: 'budgetsEnabled', ref: budgetsEnabled },
  { store: profileStore, path: 'categoriesEnabled', ref: categoriesEnabled },
  { store: profileStore, path: 'tagsEnabled', ref: tagsEnabled },
  { store: profileStore, path: 'piggyBanksEnabled', ref: piggyBanksEnabled },
  { store: profileStore, path: 'recurringTransactionsEnabled', ref: recurringTransactionsEnabled },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    await appStore.syncEverything()
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
}

const toolbar = useToolbar()
toolbar.init({
  title: computed(() => t('settings.setup.enabled_resources')),
  backRoute: RouteConstants.ROUTE_SETTINGS_SETUP,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS_SETUP,
})

onMounted(() => {
  animateSettings()
})
</script>
