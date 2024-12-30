<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="text-muted text-size-12 font-400 p-3">
          It is recommended to use these filters only if you have a large amount of transactions which results in a slow list load.
          <br>
          Ex. Show only transactions after the start of the current year.
        </div>
        <account-select v-model="account" label="Source account" />
        <div class="flex-center-vertical">
          <app-date class="flex-1" v-model="dateStart" label="Date after" />
          <app-date class="flex-1" v-model="dateEnd" label="Date before" />
        </div>
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

const profileStore = useProfileStore()
const dataStore = useDataStore()

const account = ref(null)
const dateStart = ref([])
const dateEnd = ref([])

const syncedSettings = [
  { store: profileStore, path: 'transactionListDefaultFilterAccount', ref: account },
  { store: profileStore, path: 'transactionListDefaultFilterDateStart', ref: dateStart },
  { store: profileStore, path: 'transactionListDefaultFilterDateEnd', ref: dateEnd },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('User preferences saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Transaction list default filters',
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
