<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Theme:</div>

        <app-boolean :label="themeText" v-model="darkTheme">
          <template #icon="{ value }">
            <app-icon :size="23" :stroke-width="2.0" :icon="value ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </template>
        </app-boolean>

        <page-select v-model="startingPage"></page-select>

        <app-boolean v-model="resetFormOnCreate" label="Reset forms after creation" />

      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Transaction list:</div>

        <app-select
          popupTitle="Select what Hero Icons to show"
          v-model="heroIcons"
          v-model:showDropdown="isHeroIconsDropdownVisible"
          :list="heroIconsList"
          :is-multi-select="true"
          :columns="1"
          :has-search="false"
        >
          <template #label>
            <div class="flex-center-vertical">
              <div class="">Hero Icons</div>
              <span class="info ml-5">(Right side card in the list)</span>
            </div>
          </template>
        </app-select>
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
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import { HERO_ICONS_LIST } from '~/constants/TransactionConstants.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const themeText = computed(() => (darkTheme.value ? 'Dark' : 'Light'))
const darkTheme = ref(false)
const startingPage = ref(null)
const resetFormOnCreate = ref(false)

const heroIconsList = HERO_ICONS_LIST
const isHeroIconsDropdownVisible = ref(false)
const heroIcons = ref([])

const syncedSettings = [
  { store: profileStore, path: 'darkTheme', ref: darkTheme },
  { store: profileStore, path: 'heroIcons', ref: heroIcons },
  { store: profileStore, path: 'startingPage', ref: startingPage },
  { store: profileStore, path: 'resetFormOnCreate', ref: resetFormOnCreate },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('User preferences saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'UI settings',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
