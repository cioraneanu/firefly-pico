<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <app-field-link
          :icon="TablerIconConstants.form"
          :label="$t('settings.transactions.default_form_values_entry')"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)"
        />
        <app-field-link
          :icon="TablerIconConstants.search"
          :label="$t('settings.transactions.default_list_filters_entry')"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_LIST_FILTERS)"
        />
        <app-field-link
          :icon="TablerIconConstants.amountButtons"
          :label="$t('settings.transactions.amount_increment_buttons')"
          @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_QUICK_AMOUNTS)"
        />
        <app-field-link :icon="TablerIconConstants.order" :label="$t('settings.transactions.configure_form_fields')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
        <app-field-link :icon="TablerIconConstants.list" :label="$t('settings.transactions.configure_list_fields')" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_LIST_FIELDS)" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.transactions.watchers') }}:</div>
        <div class="info">{{ $t('settings.transactions.watchers_info') }}</div>
        <app-boolean v-model="copyTagToDescription" :label="$t('settings.transactions.copy_tag_to_description')" />
        <app-boolean v-model="copyTagToCategory" :label="$t('settings.transactions.copy_tag_to_category')" />
        <app-boolean v-model="copyCategoryToDescription" :label="$t('settings.transactions.copy_category_to_description')" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
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
  await profileStore.writeProfile()
  UIUtils.showToastSuccess(t('settings.settings_saved'))
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
