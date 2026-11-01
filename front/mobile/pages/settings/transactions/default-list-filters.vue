<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="text-muted text-12 font-normal p-4">
          {{ $t('settings.transactions.default_list_filters.info') }}
        </div>
        <account-select v-model="account" :label="$t('account')" />
        <div class="flex items-center">
          <app-date v-model="dateStart" class="flex-1" :label="$t('date_after')" />
          <app-date v-model="dateEnd" class="flex-1" :label="$t('date_before')" />
        </div>
      </van-cell-group>

      <app-button-form-save />
    </van-form>
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
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.transactions.default_list_filters.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
