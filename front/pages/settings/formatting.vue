<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title">General:</div>

        <app-select
          label="Numbers formatting:"
          popupTitle="Select preferred numbers formatting"
          v-model="numberFormat"
          v-model:showDropdown="isDropdownNumberFormatVisible"
          :list="numberFormatList"
          :columns="1"
          :has-search="false"
          :rules="[{ required: true, message: 'This field is required' }]"
          required
          :clearable="false"
        />

        <app-select
          label="Date format"
          popupTitle="Select a date format"
          v-model="dateFormat"
          v-model:showDropdown="isDropdownDateFormatVisible"
          :list="dateFormatList"
          :columns="1"
          :has-search="false"
        />

        <app-select
          label="First day of month"
          popupTitle="Select the first day of month"
          v-model="firstDayOfMonth"
          v-model:showDropdown="isDropdownFirstDayVisible"
          :list="firstDayOfMonthList"
          :columns="4"
          :has-search="false"
        />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">Casing:</div>

        <app-boolean label="Force transaction description lowercase:" v-model="lowerCaseTransactionDescription" />
        <app-boolean label="Force account name lowercase:" v-model="lowerCaseAccountName" />
        <app-boolean label="Force category name lowercase:" v-model="lowerCaseCategoryName" />
        <app-boolean label="Force tag name lowercase:" v-model="lowerCaseTagName" />
        <app-boolean label="Strip accents:" v-model="stripAccents" />
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
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { saveSettingsToStore, watchSettingsStore } from '~/utils/SettingUtils.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const numberFormatList = [NUMBER_FORMAT.eu, NUMBER_FORMAT.international]
const isDropdownNumberFormatVisible = ref(false)

const dateFormat = ref(null)
const dateFormatList = [DateUtils.FORMAT_ROMANIAN_DATE, DateUtils.FORMAT_ENGLISH_DATE]
const isDropdownDateFormatVisible = ref(false)

const firstDayOfMonth = ref(null)
const firstDayOfMonthList = [...Array(27).keys()].map((item) => item + 1)
const isDropdownFirstDayVisible = ref(false)


const numberFormat = ref(null)
const stripAccents = ref(false)
const lowerCaseTransactionDescription = ref(false)
const lowerCaseAccountName = ref(false)
const lowerCaseCategoryName = ref(false)
const lowerCaseTagName = ref(false)



const syncedSettings = [
  { store: profileStore, path: 'dateFormat', ref: dateFormat },
  { store: profileStore, path: 'dashboard.firstDayOfMonth', ref: firstDayOfMonth },
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
  await profileStore.writeProfile()
  UIUtils.showToastSuccess('Settings saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Formatting settings',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
