<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Date settings:</div>-->

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

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

const appStore = useAppStore()
const dataStore = useDataStore()

// const isDateformatVisible = ref(false)

const dateFormat = ref(null)
const dateFormatList = [DateUtils.FORMAT_ROMANIAN_DATE, DateUtils.FORMAT_ENGLISH_DATE]
const isDropdownDateFormatVisible = ref(false)

const firstDayOfMonth = ref(null)
const firstDayOfMonthList = [...Array(27).keys()].map((item) => item + 1)
const isDropdownFirstDayVisible = ref(false)

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.dateFormat = dateFormat.value
  appStore.dashboard.firstDayOfMonth = firstDayOfMonth.value

  await appStore.writeProfile()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  dateFormat.value = appStore.dateFormat
  firstDayOfMonth.value = appStore.dashboard.firstDayOfMonth
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Date preferences',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
