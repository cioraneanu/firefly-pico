<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.general') }}:</div>

        <app-select
          v-model="numberFormat"
          v-model:show-dropdown="isDropdownNumberFormatVisible"
          :label="$t('settings.formatting.numbers_format') + ':'"
          :popup-title="$t('settings.formatting.select_numbers_format')"
          :list="numberFormatList"
          :columns="1"
          :has-search="false"
          :rules="[rule.required()]"
          required
          :clearable="false"
        />

        <app-select
          v-model="dateFormat"
          v-model:show-dropdown="isDropdownDateFormatVisible"
          :label="$t('settings.formatting.date_format')"
          :popup-title="$t('settings.formatting.select_date_format')"
          :list="dateFormatList"
          :columns="1"
          :has-search="false"
        />

        <day-select v-model="weekStartsOn" />

      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.formatting.casing') }}:</div>

        <app-boolean v-model="lowerCaseTransactionDescription" :label="$t('settings.formatting.force_transaction_description_lowercase')" />
        <app-boolean v-model="lowerCaseAccountName" :label="$t('settings.formatting.force_account_name_lowercase')" />
        <app-boolean v-model="lowerCaseCategoryName" :label="$t('settings.formatting.force_category_name_lowercase')" />
        <app-boolean v-model="lowerCaseTagName" :label="$t('settings.formatting.force_tag_name_lowercase')" />
        <app-boolean v-model="stripAccents" :label="$t('settings.formatting.strip_accents')" />
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
import { NUMBER_FORMAT } from '~/utils/NumberUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'
import DaySelect from '~/components/select/general/day-select.vue'
import { rule } from '~/utils/ValidationUtils.js'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const numberFormatList = [NUMBER_FORMAT.eu, NUMBER_FORMAT.international]
const isDropdownNumberFormatVisible = ref(false)

const dateFormat = ref(null)
const weekStartsOn = ref(null)
const dateFormatList = [DateUtils.FORMAT_ROMANIAN_DATE, DateUtils.FORMAT_ENGLISH_DATE]
const isDropdownDateFormatVisible = ref(false)
const isDropdownWeekStartsOnVisible = ref(false)



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
  ResponseUtils.isSuccess(response) ? UIUtils.showToastSuccess(t('settings.settings_saved')) : null
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.formatting.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
