<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <account-select v-model="defaultAccountSource" label="Default source account" />

        <account-select v-model="defaultAccountDestination" label="Default destination account" />

        <category-select v-model="defaultCategory" label="Default category" />

        <tag-select v-model="defaultTags" label="Default tags (only preselected)" />

        <tag-select v-model="autoAddedTags" label="Auto tags (appended after creation)" />

        <currency-select v-model="defaultForeignCurrency" label="Foreign currency for expenses" />
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

const defaultAccountSource = ref(null)
const defaultAccountDestination = ref(null)
const defaultCategory = ref(null)
const defaultTags = ref([])
const autoAddedTags = ref([])
const defaultForeignCurrency = ref([])

const syncedSettings = [
  { store: profileStore, path: 'defaultAccountSource', ref: defaultAccountSource },
  { store: profileStore, path: 'defaultAccountDestination', ref: defaultAccountDestination },
  { store: profileStore, path: 'defaultCategory', ref: defaultCategory },
  { store: profileStore, path: 'defaultTags', ref: defaultTags },
  { store: profileStore, path: 'autoAddedTags', ref: autoAddedTags },
  { store: profileStore, path: 'defaultForeignCurrency', ref: defaultForeignCurrency },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('User preferences saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'New transaction defaults',
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
