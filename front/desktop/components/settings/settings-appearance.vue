<template>
  <d-form class="[--label-w:13.75rem]" @submit="save">
    <d-settings-group :title="$t('settings.ui.title')">
      <d-field :label="$t('settings.ui.theme')">
        <d-tabs v-model="draft.darkTheme" :options="themes" />
      </d-field>
      <d-field :label="$t('desktop.interface')" :hint="$t('desktop.interface_hint')">
        <d-tabs v-model="uiMode" :options="uiModes" />
      </d-field>
      <d-field :label="$t('language_select.label')">
        <div class="max-w-80">
          <d-select v-model="language" :options="supportedLanguages" :get-label="(option) => option.displayName" :get-icon="(option) => option.icon" />
        </div>
      </d-field>
      <d-field :label="$t('page_select.label')">
        <div class="max-w-80">
          <d-enum-select v-model="draft.startingPage" :options="Page.typesList()" />
        </div>
      </d-field>
      <d-field :label="$t('settings.ui.show_animations')">
        <d-switch v-model="draft.showAnimations" />
      </d-field>
      <d-field :label="$t('settings.ui.reset_forms_after_creation')">
        <d-switch v-model="draft.resetFormOnCreate" />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.formatting_entry')">
      <d-field :label="$t('settings.formatting.numbers_format')">
        <div class="max-w-80">
          <d-select v-model="draft.numberFormat" :options="Object.values(NUMBER_FORMAT)" :get-label="(option) => option.name" :searchable="false" />
        </div>
      </d-field>
      <d-field :label="$t('settings.formatting.date_format')">
        <div class="max-w-80">
          <d-select v-model="draft.dateFormat" :options="[DateUtils.FORMAT_ROMANIAN_DATE, DateUtils.FORMAT_ENGLISH_DATE]" :searchable="false" />
        </div>
      </d-field>
      <d-field :label="$t('day_select.label')">
        <div class="max-w-80">
          <d-select v-model="weekStart" :options="weekdays" :searchable="false" />
        </div>
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.formatting.casing')">
      <div class="flex flex-col">
        <d-switch v-for="casing in casings" :key="casing.path" v-model="draft[casing.path]">{{ $t(casing.t) }}</d-switch>
      </div>
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @reset="reset" />
  </d-form>
</template>

<script setup>
import { IconDeviceDesktop, IconDeviceMobile, IconMoon, IconSparkles, IconSun } from '@tabler/icons-vue'
import { addDays, startOfWeek } from 'date-fns'
import { capitalize } from 'lodash-es'
import { supportedLanguages } from '~/i18n/index.js'
import Page from '~/core/models/Page'
import { NUMBER_FORMAT } from '~/core/utils/NumberUtils'

const { t, locale } = useI18n()

const casings = [
  { path: 'lowerCaseTransactionDescription', t: 'settings.formatting.force_transaction_description_lowercase' },
  { path: 'lowerCaseAccountName', t: 'settings.formatting.force_account_name_lowercase' },
  { path: 'lowerCaseCategoryName', t: 'settings.formatting.force_category_name_lowercase' },
  { path: 'lowerCaseTagName', t: 'settings.formatting.force_tag_name_lowercase' },
  { path: 'stripAccents', t: 'settings.formatting.strip_accents' },
]

const { draft, save, reset, isSaving } = useSettingsDraft([
  'darkTheme',
  'language',
  'startingPage',
  'showAnimations',
  'resetFormOnCreate',
  'numberFormat',
  'dateFormat',
  'weekStartsOn',
  ...casings.map((casing) => casing.path),
])

const themes = computed(() => [
  { value: false, label: t('settings.ui.light'), icon: IconSun },
  { value: true, label: t('settings.ui.dark'), icon: IconMoon },
])

const uiModes = computed(() => [
  { value: 'auto', label: t('desktop.interface_auto'), icon: IconSparkles },
  { value: 'desktop', label: t('desktop.interface_desktop'), icon: IconDeviceDesktop },
  { value: 'mobile', label: t('desktop.interface_mobile'), icon: IconDeviceMobile },
])

const uiMode = useUIMode()

const language = computed({
  get: () => supportedLanguages.find((option) => option.code === draft.language),
  set: (option) => (draft.language = option.code),
})

const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) => ({ value: index, label: capitalize(addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), index).toLocaleDateString(locale.value, { weekday: 'long' })) })),
)
const weekStart = computed({
  get: () => weekdays.value[draft.weekStartsOn],
  set: (option) => (draft.weekStartsOn = option.value),
})
</script>
