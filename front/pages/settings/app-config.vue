<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Setup</div>-->

        <app-field
          v-model="picoBackendURL"
          left-icon="link-o"
          label="Pico backend URL"
          :rules="[{ required: true, message: 'This field is required' }]"
          required
        />

        <settings-token-field v-model="authToken" required />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">Loaded data stats</div>

        <van-grid :column-num="3">
          <app-config-stat :icon="TablerIconConstants.account" name="Account" :value="accountsCount" />

          <app-config-stat :icon="TablerIconConstants.category" name="Categories" :value="categoriesCount" />

          <app-config-stat :icon="TablerIconConstants.tag" name="Tags" :value="tagsCount" />

          <app-config-stat
            :icon="TablerIconConstants.transactionTemplate"
            name="Templates"
            :value="transactionTemplatesCount"
          />

          <app-config-stat :icon="TablerIconConstants.lastSync" name="Last sync" :value="lastSync" />
        </van-grid>
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
import SettingsTokenField from '~/components/settings/settings-token-field.vue'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

import AppConfigStat from '~/components/settings/app-config-stat.vue'
import UserRepository from '~/repository/UserRepository'
import TablerIconConstants from '~/constants/TablerIconConstants'

const appStore = useAppStore()
const dataStore = useDataStore()

const authToken = ref('')
const picoBackendURL = ref('')

const accountsCount = computed(() => dataStore.accountList.length)
const categoriesCount = computed(() => dataStore.categoryList.length)
const tagsCount = computed(() => dataStore.tagList.length)
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
})

const onSave = async () => {
  appStore.authToken = authToken.value
  appStore.picoBackendURL = picoBackendURL.value

  UIUtils.showToastLoading('Checking configuration')
  const userResponse = await new UserRepository().getUser()
  UIUtils.stopToastLoading()

  if (!ResponseUtils.isSuccess(userResponse)) {
    UIUtils.showToastError('The provided endpoint + token is not correct.')
    return
  }

  UIUtils.showToastLoading('Fetching data')
  await dataStore.syncEverything()
  UIUtils.stopToastLoading()
  UIUtils.showToastSuccess('Settings saved')
}

const toolbar = useToolbar()
toolbar.init({
  title: 'App settings',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
