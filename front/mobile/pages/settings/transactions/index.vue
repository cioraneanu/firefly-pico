<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card-info>
          <app-field-link :icon="IconForms" :label="$t('settings.transactions.default_form_values_entry')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)" />
          <app-field-link :icon="IconFilter" :label="$t('settings.transactions.default_list_filters_entry')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_LIST_FILTERS)" />
          <app-field-link :icon="IconSquareRoundedPlus" :label="$t('settings.transactions.amount_increment_buttons')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_QUICK_AMOUNTS)" />
          <app-field-link :icon="IconAdjustments" :label="$t('settings.transactions.configure_form_fields')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
          <app-field-link :icon="IconLayoutList" :label="$t('settings.transactions.configure_list_fields')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_LIST_FIELDS)" />
        </app-card-info>

        <app-card :section="$t('settings.transactions.watchers')">
          <p class="mx-d" style="margin-top: -4px">{{ $t('settings.transactions.watchers_info') }}</p>
          <app-boolean v-model="copyTagToDescription" :label="$t('settings.transactions.copy_tag_to_description')" />
          <div class="mx-hr" />
          <app-boolean v-model="copyTagToCategory" :label="$t('settings.transactions.copy_tag_to_category')" />
          <div class="mx-hr" />
          <app-boolean v-model="copyCategoryToDescription" :label="$t('settings.transactions.copy_category_to_description')" />
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
import { IconAdjustments, IconFilter, IconForms, IconLayoutList, IconSquareRoundedPlus } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()

const copyCategoryToDescription = ref(false)
const copyTagToDescription = ref(false)
const copyTagToCategory = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'copyCategoryToDescription', ref: copyCategoryToDescription },
  { store: profileStore, path: 'copyTagToDescription', ref: copyTagToDescription },
  { store: profileStore, path: 'copyTagToCategory', ref: copyTagToCategory },
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
  title: t('settings.transactions.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
