<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card :section="$t('settings.general')">
          <app-select
            v-model="numberFormat"
            v-model:show-dropdown="isDropdownNumberFormatVisible"
            name="numberFormat"
            :label="$t('settings.formatting.numbers_format')"
            :popup-title="$t('settings.formatting.select_numbers_format')"
            :list="numberFormatList"
            :has-search="false"
            :rules="[rule.required()]"
            :clearable="false"
          />

          <div class="mx-2">
            <app-select
              v-model="dateFormat"
              v-model:show-dropdown="isDropdownDateFormatVisible"
              :label="$t('settings.formatting.date_format')"
              :popup-title="$t('settings.formatting.select_date_format')"
              :list="dateFormatList"
              :has-search="false"
            />

            <day-select v-model="weekStartsOn" />
          </div>
        </app-card>

        <app-card :section="$t('settings.formatting.casing')">
          <app-boolean v-model="lowerCaseTransactionDescription" :label="$t('settings.formatting.force_transaction_description_lowercase')" />
          <div class="mx-hr" />
          <app-boolean v-model="lowerCaseAccountName" :label="$t('settings.formatting.force_account_name_lowercase')" />
          <div class="mx-hr" />
          <app-boolean v-model="lowerCaseCategoryName" :label="$t('settings.formatting.force_category_name_lowercase')" />
          <div class="mx-hr" />
          <app-boolean v-model="lowerCaseTagName" :label="$t('settings.formatting.force_tag_name_lowercase')" />
          <div class="mx-hr" />
          <app-boolean v-model="stripAccents" :label="$t('settings.formatting.strip_accents')" />
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { NUMBER_FORMAT } from '~/core/utils/NumberUtils.js'
import { saveSettingsToStore, watchSettingsStore } from '~/core/utils/SettingUtils.js'
import DaySelect from '~/mobile/components/select/general/day-select.vue'
import { rule } from '~/core/utils/ValidationUtils.js'

const { t } = useI18n()
const profileStore = useProfileStore()

const numberFormatList = [NUMBER_FORMAT.eu, NUMBER_FORMAT.international]
const isDropdownNumberFormatVisible = ref(false)

const dateFormat = ref(null)
const weekStartsOn = ref(null)
const dateFormatList = [DateUtils.FORMAT_ROMANIAN_DATE, DateUtils.FORMAT_ENGLISH_DATE]
const isDropdownDateFormatVisible = ref(false)

const numberFormat = ref(null)
const stripAccents = ref(false)
const lowerCaseTransactionDescription = ref(false)
const lowerCaseAccountName = ref(false)
const lowerCaseCategoryName = ref(false)
const lowerCaseTagName = ref(false)

const syncedSettings = [
  { store: profileStore, path: 'dateFormat', ref: dateFormat },
  { store: profileStore, path: 'weekStartsOn', ref: weekStartsOn },
  { store: profileStore, path: 'numberFormat', ref: numberFormat },
  { store: profileStore, path: 'stripAccents', ref: stripAccents },
  { store: profileStore, path: 'lowerCaseTransactionDescription', ref: lowerCaseTransactionDescription },
  { store: profileStore, path: 'lowerCaseAccountName', ref: lowerCaseAccountName },
  { store: profileStore, path: 'lowerCaseCategoryName', ref: lowerCaseCategoryName },
  { store: profileStore, path: 'lowerCaseTagName', ref: lowerCaseTagName },
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
  title: t('settings.formatting.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
