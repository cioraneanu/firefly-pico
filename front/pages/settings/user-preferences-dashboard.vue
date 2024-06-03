<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Config:</div>
        <app-boolean label="Show accounts with 0 amount:" v-model="areEmptyAccountsVisible" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Transaction exclusion:</div>
        <account-select v-model="excludedAccountsList" :isMultiSelect="true" />
        <category-select v-model="excludedCategoriesList" :isMultiSelect="true" />
        <tag-select v-model="excludedTagsList" :isMultiSelect="true" />
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
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const appStore = useAppStore()
const dataStore = useDataStore()

const areEmptyAccountsVisible = ref(false)

const excludedAccountsList = ref([])
const excludedCategoriesList = ref([])
const excludedTagsList = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.dashboard.areEmptyAccountsVisible = areEmptyAccountsVisible.value

  appStore.dashboard.excludedAccountsList = excludedAccountsList.value
  appStore.dashboard.excludedCategoriesList = excludedCategoriesList.value
  appStore.dashboard.excludedTagsList = excludedTagsList.value

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  areEmptyAccountsVisible.value = appStore.dashboard.areEmptyAccountsVisible

  excludedAccountsList.value = appStore.dashboard.excludedAccountsList
  excludedCategoriesList.value = appStore.dashboard.excludedCategoriesList
  excludedTagsList.value = appStore.dashboard.excludedTagsList
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Dashboard preferences',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
