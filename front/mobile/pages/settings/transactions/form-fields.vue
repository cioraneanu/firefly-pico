<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <settings-order-list v-model="fieldsList" :hint="$t('settings.reorder_hint_fields')" />

        <app-card>
          <app-boolean v-model="isForeignCurrencyAlwaysVisible" :label="$t('settings.transactions.form_fields.always_show_foreign_currency')" />
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
import { transactionFormFieldList } from '~/core/constants/TransactionConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import { migrateTypeList } from '~/core/utils/MigrateUtils.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()

const fieldsList = ref([])

onMounted(() => {
  init()
})

const isForeignCurrencyAlwaysVisible = ref(false)
const syncedSettings = [{ store: profileStore, path: 'isForeignCurrencyAlwaysVisible', ref: isForeignCurrencyAlwaysVisible }]
watchSettingsStore(syncedSettings)

const onSave = async () => {
  profileStore.transactionFormFieldsConfig = fieldsList.value
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
  init()
}

const init = () => {
  fieldsList.value = migrateTypeList(profileStore.transactionFormFieldsConfig, transactionFormFieldList)
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.transactions.form_fields.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
