<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('desktop.interface') }}:</div>
        <app-tabs v-model="uiMode" :items="uiModes" class="mx-4 mb-1" />
        <div class="text-muted text-12 mx-4 mb-3">{{ $t('desktop.interface_hint') }}</div>
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">{{ $t('settings.ui.theme') }}:</div>

        <app-boolean v-model="darkTheme" :label="themeText">
          <template #icon="{ value }">
            <app-icon :size="23" :stroke-width="2.0" :icon="value ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </template>
        </app-boolean>

        <language-select v-model="language" />

        <page-select v-model="startingPage" />

        <app-boolean v-model="showAnimations" :label="$t('settings.ui.show_animations')" />

        <app-boolean v-model="resetFormOnCreate" :label="$t('settings.ui.reset_forms_after_creation')" />
        <app-boolean v-model="isProfileFloatVisible" :label="$t('settings.ui.is_profile_float_visible')" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { UI_MODES } from '~/core/utils/UIModeUtils'
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import LanguageSelect from '~/mobile/components/select/general/language-select.vue'

const { t } = useI18n()

const uiModes = computed(() => UI_MODES.map((mode) => ({ value: mode, label: t(`desktop.interface_${mode}`) })))
const uiMode = useUIMode()
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
})

onMounted(() => {
  animateSettings()
})
</script>
