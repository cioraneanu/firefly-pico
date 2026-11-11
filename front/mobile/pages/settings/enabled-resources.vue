<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card>
          <app-boolean v-model="budgetsEnabled" :label="$t('settings.setup.enable_budgets')" />
          <div class="mx-hr" />
          <app-boolean v-model="categoriesEnabled" :label="$t('settings.setup.enable_categories')" />
          <div class="mx-hr" />
          <app-boolean v-model="tagsEnabled" :label="$t('settings.setup.enable_tags')" />
          <div class="mx-hr" />
          <app-boolean v-model="piggyBanksEnabled" :label="$t('settings.setup.enable_piggy_banks')" />
          <div class="mx-hr" />
          <app-boolean v-model="recurringTransactionsEnabled" :label="$t('settings.setup.enable_recurring_transactions')" />
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
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
})

onMounted(() => {
  animateSettings()
})
</script>
