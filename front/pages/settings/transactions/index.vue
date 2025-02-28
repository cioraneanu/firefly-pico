<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title mb-0">Config:</div>-->
        <app-field-link :icon="TablerIconConstants.form" label="Default form values" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)" />
        <app-field-link :icon="TablerIconConstants.search" label="Default list filters" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_LIST_FILTERS)" />
        <app-field-link :icon="TablerIconConstants.amountButtons" label="Amount increment buttons" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_QUICK_AMOUNTS)" />
        <app-field-link :icon="TablerIconConstants.order" label="Configure form fields" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
        <app-field-link :icon="TablerIconConstants.order" label="Configure list fields" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_LIST_FIELDS)" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Watchers:</div>
        <div class="info">Applies only while creating a transaction</div>
        <app-boolean v-model="copyTagToDescription" label="When I select a Tag copy it into Description" />
        <app-boolean v-model="copyTagToCategory" label="When I select a Tag copy it into Category" />
        <app-boolean v-model="copyCategoryToDescription" label="When I select a Category copy it into Description" />
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
  UIUtils.showToastSuccess('User preferences saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Transaction settings',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
