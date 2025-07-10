<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Setup</div>-->

        <app-field left-icon="link-o" v-model="picoBackendURL" :label="$t('settings.setup.pico_backend_url')" :rules="[rule.required()]" required />
        <settings-token-field v-model="authToken" required />
        <app-boolean left-icon="points" :label="$t('settings.setup.sync_settings_via_token')" v-model="syncProfileInDB" />
        <app-field v-model="daysBetweenFullSync" :label="$t('settings.setup.days_between_sync')" :rules="[rule.required()]" required />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.setup.loaded_data_stats') }}</div>

        <van-grid :column-num="3">
          <app-config-stat :icon="TablerIconConstants.account" :name="$t('settings.setup.account')" :value="accountsCount" />
          <app-config-stat :icon="TablerIconConstants.category" :name="$t('settings.setup.categories')" :value="categoriesCount" />
          <app-config-stat :icon="TablerIconConstants.tag" :name="$t('settings.setup.tags')" :value="tagsCount" />
          <app-config-stat :icon="TablerIconConstants.transactionTemplate" :name="$t('settings.setup.templates')" :value="transactionTemplatesCount" />
          <app-config-stat :icon="TablerIconConstants.budget" :name="$t('settings.setup.budgets')" :value="budgetsCount" />
          <app-config-stat :icon="TablerIconConstants.lastSync" :name="$t('settings.setup.last_sync')" :value="lastSync" />
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
import { rule } from '~/utils/ValidationUtils.js'

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
const { t } = useI18n()

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

  UIUtils.showToastLoading(t('settings.setup.verifying'))
  let userResponse = await new UserRepository().getUser()
  UIUtils.stopToastLoading()
  if (!ResponseUtils.isSuccess(userResponse)) {
    UIUtils.showToastError(t('settings.setup.invalid_endpoint'))
    return
  }

  let userId = get(userResponse, 'data.data.id')
  if (!userId) {
    UIUtils.showToastError(t('settings.setup.invalid_token'))
    return
  }

  UIUtils.showToastLoading(t('settings.setup.fetching'))
  await dataStore.syncEverything()
  UIUtils.stopToastLoading()
  UIUtils.showToastSuccess(t('settings.settings_saved'))
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.setup.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
