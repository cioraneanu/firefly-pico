<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">

      <van-cell-group inset>
        <app-field-link label="Dashboard cards order" @click="onGoToDashboardCardsOrder" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Config:</div>
        <app-boolean label="Show accounts with 0 amount:" v-model="areEmptyAccountsVisible" />
        <app-boolean label="Show decimal places:" v-model="showDecimal" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Transaction exclusion:</div>
        <account-select v-model="excludedAccountsList" :isMultiSelect="true" />
        <category-select v-model="excludedCategoriesList" :isMultiSelect="true" />
        <tag-select v-model="excludedTagsList" :isMultiSelect="true" :autoSelectParents="false" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore.js'
import { useDataStore } from '~/stores/dataStore.js'
import UIUtils from '~/utils/UIUtils.js'
import { useToolbar } from '~/composables/useToolbar.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'

const profileStore = useProfileStore()

const areEmptyAccountsVisible = ref(false)
const showDecimal = ref(false)
const excludedAccountsList = ref([])
const excludedCategoriesList = ref([])
const excludedTagsList = ref([])

const syncedSettings = [
  { store: profileStore, path: 'dashboard.areEmptyAccountsVisible', ref: areEmptyAccountsVisible },
  { store: profileStore, path: 'dashboard.showDecimal', ref: showDecimal },
  { store: profileStore, path: 'dashboard.excludedAccountsList', ref: excludedAccountsList },
  { store: profileStore, path: 'dashboard.excludedCategoriesList', ref: excludedCategoriesList },
  { store: profileStore, path: 'dashboard.excludedTagsList', ref: excludedTagsList },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('User preferences saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Dashboard settings',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

const onGoToDashboardCardsOrder = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER)


onMounted(() => {
  animateSettings()
})
</script>
