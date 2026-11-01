<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset class="">
        <div class="flex-col van-cell p-2.5">
          <app-repeater v-model="fieldsList" :is-list-dynamic="false" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <div class="app-field m-1.25 cursor-pointer" @click="onClickIsVisible(element)">
                <div :class="getElementClass(element)">
                  <app-icon :icon="element.icon" :size="20" />
                  <div class="flex-1 text-14">{{ element.t ? $t(element.t) : element.name }}</div>
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
import { useProfileStore } from '~/core/stores/profileStore'

import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { transactionFormFieldList, transactionListHeroIconList } from '~/core/constants/TransactionConstants.js'
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
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
  init()
}

const getIsVisibleIcon = (element) => {
  return element.isVisible ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden
}

const getElementClass = (element) => {
  return {
    'van-field__body flex items-center gap-1 pointer-events-none select-none': true,
    'text-muted' : !element.isVisible
  }
}

const onClickIsVisible = (element) => {
  element.isVisible = !element.isVisible
}

const init = () => {
  fieldsList.value = migrateTypeList(profileStore.transactionFormFieldsConfig, transactionFormFieldList)
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.transactions.form_fields.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
