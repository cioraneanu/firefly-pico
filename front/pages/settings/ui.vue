<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.ui.theme') }}:</div>

        <app-boolean :label="themeText" v-model="darkTheme">
          <template #icon="{ value }">
            <app-icon :size="23" :stroke-width="2.0" :icon="value ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </template>
        </app-boolean>

        <language-select v-model="language"></language-select>

        <page-select v-model="startingPage"></page-select>

        <app-boolean v-model="resetFormOnCreate" :label="$t('settings.ui.reset_forms_after_creation')" />
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
import LanguageSelect from '~/components/select/general/language-select.vue'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const themeText = computed(() => (darkTheme.value ? t('settings.ui.dark') : t('settings.ui.light')))
const darkTheme = ref(false)
const startingPage = ref(null)
const language = ref(null)
const resetFormOnCreate = ref(false)



const syncedSettings = [
  { store: profileStore, path: 'darkTheme', ref: darkTheme },
  { store: profileStore, path: 'language', ref: language },
  { store: profileStore, path: 'startingPage', ref: startingPage },
  { store: profileStore, path: 'resetFormOnCreate', ref: resetFormOnCreate },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  await profileStore.writeProfile()
  UIUtils.showToastSuccess(t('settings.user_preferences_saved'))
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.ui.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
