<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Config:</div>
        <app-field-link label="Amount increment buttons" @click="onGoToQuickTransactionAmounts" />
        <app-field-link label="Transaction fields order" @click="onGoToTransactionFieldsOrder" />
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
import { HERO_ICONS_LIST } from '~/constants/TransactionConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'

const profileStore = useProfileStore()

const heroIconsList = HERO_ICONS_LIST
const isHeroIconsDropdownVisible = ref(false)

const heroIcons = ref([])
const copyCategoryToDescription = ref(false)
const copyTagToDescription = ref(false)
const copyTagToCategory = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'heroIcons', ref: heroIcons },
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

const onGoToQuickTransactionAmounts = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_QUICK_AMOUNTS)
const onGoToTransactionFieldsOrder = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTION_FIELDS_ORDER)

const toolbar = useToolbar()
toolbar.init({
  title: 'Transaction config',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
