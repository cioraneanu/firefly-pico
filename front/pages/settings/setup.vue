<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Setup</div>-->

        <app-field left-icon="link-o" v-model="picoBackendURL" label="Pico backend URL" :rules="[{ required: true, message: 'This field is required' }]" required />
        <settings-token-field v-model="authToken" required />
        <app-boolean left-icon="points" label="Sync settings across devices via token" v-model="syncProfileInDB" />
        <app-field v-model="daysBetweenFullSync" label='Days between full sync of "Extras"' :rules="[{ required: true, message: 'This field is required' }]" required />

      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">Loaded data stats</div>

        <van-grid :column-num="3">
          <app-config-stat :icon="TablerIconConstants.account" name="Account" :value="accountsCount" />
          <app-config-stat :icon="TablerIconConstants.category" name="Categories" :value="categoriesCount" />
          <app-config-stat :icon="TablerIconConstants.tag" name="Tags" :value="tagsCount" />
          <app-config-stat :icon="TablerIconConstants.transactionTemplate" name="Templates" :value="transactionTemplatesCount" />
          <app-config-stat :icon="TablerIconConstants.budget" name="Budgets" :value="budgetsCount" />
          <app-config-stat :icon="TablerIconConstants.lastSync" name="Last sync" :value="lastSync" />
        </van-grid>
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
import SettingsTokenField from '~/components/settings/settings-token-field.vue'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

import AppConfigStat from '~/components/settings/app-config-stat.vue'
import UserRepository from '~/repository/UserRepository'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { get } from 'lodash'

const appStore = useAppStore()
const dataStore = useDataStore()

const authToken = ref('')
const picoBackendURL = ref('')
const syncProfileInDB = ref(true)
const daysBetweenFullSync = ref(4)

const accountsCount = computed(() => dataStore.accountList.length)
const categoriesCount = computed(() => dataStore.categoryList.length)
const tagsCount = computed(() => dataStore.tagList.length)
const budgetsCount = computed(() => dataStore.budgetList.length)
const transactionTemplatesCount = computed(() => dataStore.transactionTemplateList.length)
const lastSync = computed(() => {
  if (!dataStore.lastSync) {
    return ' - '
  }
  return DateUtils.dateToUIWithTime(dataStore.lastSync, DateUtils.FORMAT_ROMANIAN_DATE_HOUR_MINUTE)
})

onMounted(() => {
  authToken.value = appStore.authToken
  picoBackendURL.value = appStore.picoBackendURL
  syncProfileInDB.value = appStore.syncProfileInDB
  daysBetweenFullSync.value = appStore.daysBetweenFullSync
})

const onSave = async () => {
  picoBackendURL.value = picoBackendURL.value.endsWith('/') ? picoBackendURL.value.slice(0, -1) : picoBackendURL.value

  appStore.authToken = authToken.value
  appStore.picoBackendURL = picoBackendURL.value
  appStore.syncProfileInDB = syncProfileInDB.value
  appStore.daysBetweenFullSync = daysBetweenFullSync.value

  UIUtils.showToastLoading('Verifying...')
  let userResponse = await new UserRepository().getUser()
  UIUtils.stopToastLoading()


  if (!ResponseUtils.isSuccess(userResponse)) {
    UIUtils.showToastError('The provided endpoint is not correct.')
    return
  }

  let userId = get(userResponse, 'data.data.id')
  if (!userId) {
    UIUtils.showToastError('The provided token is not correct or expired.')
    return
  }



  UIUtils.showToastLoading('Fetching...')
  await dataStore.syncEverything()
  UIUtils.stopToastLoading()
  UIUtils.showToastSuccess('Settings saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'Setup',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
