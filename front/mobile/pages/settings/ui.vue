<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card :section="$t('desktop.interface')">
          <div class="mx-f">
            <app-tabs v-model="uiMode" :items="uiModes" />
            <div class="mx-d">{{ $t('desktop.interface_hint') }}</div>
          </div>
        </app-card>

        <app-card :section="$t('settings.ui.appearance')">
          <div class="mx-f">
            <div class="mx-l">{{ $t('settings.ui.theme') }}</div>
            <div class="mx-seg mx-seg--sm grid grid-cols-2 w-full" role="tablist" :aria-label="$t('settings.ui.theme')">
              <button
                v-for="option in themeOptions"
                :key="option.label"
                type="button"
                role="tab"
                class="justify-center"
                :class="{ on: darkTheme === option.value }"
                :aria-selected="darkTheme === option.value"
                @click="darkTheme = option.value"
              >
                <app-icon :icon="option.icon" :size="15" :stroke="2" />
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>

          <language-select v-model="language" />

          <page-select v-model="startingPage" />

          <div class="mx-hr" />
          <app-boolean v-model="showAnimations" :label="$t('settings.ui.show_animations')" />
          <div class="mx-hr" />
          <app-boolean v-model="resetFormOnCreate" :label="$t('settings.ui.reset_forms_after_creation')" />
          <div class="mx-hr" />
          <app-boolean v-model="isProfileFloatVisible" :label="$t('settings.ui.is_profile_float_visible')" />
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { UI_MODES } from '~/core/utils/UIModeUtils'
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { IconMoon, IconSun } from '@tabler/icons-vue'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import LanguageSelect from '~/mobile/components/select/general/language-select.vue'

const { t } = useI18n()

const uiModes = computed(() => UI_MODES.map((mode) => ({ value: mode, label: t(`desktop.interface_${mode}`) })))
const uiMode = useUIMode()
const profileStore = useProfileStore()
const themeOptions = computed(() => [
  { value: false, label: t('settings.ui.light'), icon: IconSun },
  { value: true, label: t('settings.ui.dark'), icon: IconMoon },
])
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
  if (ResponseUtils.isSuccess(response)) {
    UIUtils.showToastSuccess(t('settings.settings_saved'))
  }
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
