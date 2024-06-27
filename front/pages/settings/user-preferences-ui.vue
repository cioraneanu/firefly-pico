<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <app-boolean label="Dark theme:" v-model="darkTheme">
          <template #icon="{ value }">
            <app-icon :size="23" :stroke-width="2.0" :icon="value ? TablerIconConstants.darkTheme : TablerIconConstants.whiteTheme" />
          </template>
        </app-boolean>

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
      </van-cell-group>

      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Date settings:</div>-->

        <app-boolean label="Force transaction description lowercase:" v-model="lowerCaseTransactionDescription" />
        <app-boolean label="Force account name lowercase:" v-model="lowerCaseAccountName" />
        <app-boolean label="Force category name lowercase:" v-model="lowerCaseCategoryName" />
        <app-boolean label="Force tag name lowercase:" v-model="lowerCaseTagName" />
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

const profileStore = useProfileStore()
const dataStore = useDataStore()

const numberFormat = ref(null)
const numberFormatList = [NUMBER_FORMAT.eu, NUMBER_FORMAT.international]
const isDropdownNumberFormatVisible = ref(false)

const darkTheme = ref(false)

const lowerCaseTransactionDescription = ref(false)
const lowerCaseAccountName = ref(false)
const lowerCaseCategoryName = ref(false)
const lowerCaseTagName = ref(false)

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.numberFormat = numberFormat.value

  profileStore.lowerCaseTransactionDescription = lowerCaseTransactionDescription.value
  profileStore.lowerCaseAccountName = lowerCaseAccountName.value
  profileStore.lowerCaseCategoryName = lowerCaseCategoryName.value
  profileStore.lowerCaseTagName = lowerCaseTagName.value

  profileStore.darkTheme = darkTheme.value

  await profileStore.writeProfile()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  numberFormat.value = profileStore.numberFormat

  lowerCaseTransactionDescription.value = profileStore.lowerCaseTransactionDescription
  lowerCaseAccountName.value = profileStore.lowerCaseAccountName
  lowerCaseCategoryName.value = profileStore.lowerCaseCategoryName
  lowerCaseTagName.value = profileStore.lowerCaseTagName

  darkTheme.value = profileStore.darkTheme
}

const toolbar = useToolbar()
toolbar.init({
  title: 'UI preferences',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
