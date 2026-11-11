<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <div class="mx-note">
          <app-icon :icon="IconInfoCircle" :size="16" :stroke="2" />
          <span>{{ $t('settings.transactions.default_list_filters.info') }}</span>
        </div>

        <app-card>
          <account-select v-model="account" :label="$t('account')" />
          <div class="mx-2">
            <app-date v-model="dateStart" :label="$t('date_after')" />
            <app-date v-model="dateEnd" :label="$t('date_before')" />
          </div>
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'

import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { useI18n } from 'vue-i18n'
import { IconInfoCircle } from '@tabler/icons-vue'

const { t } = useI18n()
const profileStore = useProfileStore()

const account = ref(null)
const dateStart = ref(null)
const dateEnd = ref(null)

const syncedSettings = [
  { store: profileStore, path: 'transactionListDefaultFilterAccount', ref: account },
  { store: profileStore, path: 'transactionListDefaultFilterDateStart', ref: dateStart },
  { store: profileStore, path: 'transactionListDefaultFilterDateEnd', ref: dateEnd },
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
  title: t('settings.transactions.default_list_filters.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
