<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.ui.theme') }}:</div>

        <app-boolean v-model="darkTheme" :label="themeText">
          <template #icon="{ value }">
            <app-icon :size="23" :stroke-width="2.0" :icon="value ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </template>
        </app-boolean>

        <language-select v-model="language"/>

        <page-select v-model="startingPage"/>

        <app-boolean v-model="showAnimations" :label="$t('settings.ui.show_animations')" />

        <app-boolean v-model="resetFormOnCreate" :label="$t('settings.ui.reset_forms_after_creation')" />
        <app-boolean v-model="isProfileFloatVisible" :label="$t('settings.ui.is_profile_float_visible')" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import LanguageSelect from '~/components/select/general/language-select.vue'

const { t } = useI18n()
const profileStore = useProfileStore()
const themeText = computed(() => (darkTheme.value ? t('settings.ui.dark') : t('settings.ui.light')))
const darkTheme = ref(false)
const startingPage = ref(null)
const language = ref(null)
const showAnimations = ref(true)
const resetFormOnCreate = ref(false)
const isProfileFloatVisible = ref(true)

const syncedSettings = [
  { store: profileStore, path: 'darkTheme', ref: darkTheme },
  { store: profileStore, path: 'language', ref: language },
  { store: profileStore, path: 'startingPage', ref: startingPage },
  { store: profileStore, path: 'showAnimations', ref: showAnimations },
  { store: profileStore, path: 'resetFormOnCreate', ref: resetFormOnCreate },
  { store: profileStore, path: 'dashboard.isProfileFloatVisible', ref: isProfileFloatVisible },
]

watchSettingsStore(syncedSettings)

const onSave = async () => {
  saveSettingsToStore(syncedSettings)
  const response = await profileStore.writeProfile()
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
}

const toolbar = useToolbar()
toolbar.init({
  title: computed(() => t('settings.ui.title')),
  backRoute: RouteConstants.ROUTE_SETTINGS,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
