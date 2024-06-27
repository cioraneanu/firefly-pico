<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Config:</div>
        <app-boolean label="Show accounts with 0 amount:" v-model="areEmptyAccountsVisible" />
        <app-boolean label="Show decimal places:" v-model="showDecimal" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Transaction exclusion:</div>
        <account-select v-model="excludedAccountsList" :isMultiSelect="true" />
        <category-select v-model="excludedCategoriesList" :isMultiSelect="true" />
        <tag-select v-model="excludedTagsList" :isMultiSelect="true" :autoSelectParents="false" />
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

const profileStore = useProfileStore()
const dataStore = useDataStore()

const areEmptyAccountsVisible = ref(false)
const showDecimal = ref(false)


const excludedAccountsList = ref([])
const excludedCategoriesList = ref([])
const excludedTagsList = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.dashboard.areEmptyAccountsVisible = areEmptyAccountsVisible.value
  profileStore.dashboard.showDecimal = showDecimal.value

  profileStore.dashboard.excludedAccountsList = excludedAccountsList.value
  profileStore.dashboard.excludedCategoriesList = excludedCategoriesList.value
  profileStore.dashboard.excludedTagsList = excludedTagsList.value

  await profileStore.writeProfile()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  areEmptyAccountsVisible.value = profileStore.dashboard.areEmptyAccountsVisible
  showDecimal.value = profileStore.dashboard.showDecimal


  excludedAccountsList.value = profileStore.dashboard.excludedAccountsList
  excludedCategoriesList.value = profileStore.dashboard.excludedCategoriesList
  excludedTagsList.value = profileStore.dashboard.excludedTagsList
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Dashboard preferences',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
