<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset class="">
        <div class="flex-column van-cell p-10">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-5" @click="onClickIsVisible(element)">
                <div class="van-field__body flex-center-vertical gap-1 pointer-events-none prevent-select">
                  <app-icon :icon="element.icon" :size="20" />
                  <div class="flex-1">{{ element.name }}</div>
                  <app-icon :icon="getIsVisibleIcon(element)" :size="20" />
                </div>
              </div>
            </template>
          </app-repeater>
        </div>
      </van-cell-group>

      <van-cell-group inset>
        <app-boolean v-model="isForeignCurrencyAlwaysVisible" :label="$t('settings.transactions.form_fields.always_show_foreign_currency')" />
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
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { transactionFormFieldsConfigList, transactionListHeroIconConfigList } from '~/constants/TransactionConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

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
  await profileStore.writeProfile()
  UIUtils.showToastSuccess(t('settings.user_preferences_saved'))
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  let isListOk = profileStore.transactionFormFieldsConfig.length === transactionFormFieldsConfigList.length
  fieldsList.value = isListOk ? profileStore.transactionFormFieldsConfig : transactionFormFieldsConfigList
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
