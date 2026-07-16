<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <!--        <div class="van-cell-group-title">Setup</div>-->

        <app-field v-model="picoBackendURL" left-icon="link-o" :label="$t('settings.setup.pico_backend_url')" :rules="[rule.required()]" required>
          <template #button>
            <van-button size="small" native-type="button" :aria-label="$t('settings.setup.http_headers')" @click.stop="showHeadersDialog = true">
              <app-icon :icon="TablerIconConstants.settings" :size="18" />
            </van-button>
          </template>
        </app-field>
        <settings-token-field v-model="authToken" required />
        <app-boolean v-model="syncProfileInDB" left-icon="points" :label="$t('settings.setup.sync_settings_via_token')" />
        <app-field v-model="daysBetweenFullSync" :label="$t('settings.setup.days_between_sync')" :rules="[rule.required()]" required />
      </van-cell-group>

      <van-cell-group inset>
        <app-field-link :label="$t('settings.setup.enabled_resources')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ENABLED_RESOURCES)" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('settings.setup.loaded_data_stats') }}</div>

        <van-grid :column-num="3">
          <app-config-stat :icon="TablerIconConstants.account" :name="$t('settings.setup.account')" :value="accountsCount" />
          <app-config-stat :icon="TablerIconConstants.category" :name="$t('settings.setup.categories')" :value="categoriesCount" :muted="!profileStore.categoriesEnabled" />
          <app-config-stat :icon="TablerIconConstants.tag" :name="$t('settings.setup.tags')" :value="tagsCount" :muted="!profileStore.tagsEnabled" />
          <app-config-stat :icon="TablerIconConstants.transactionTemplate" :name="$t('settings.setup.templates')" :value="transactionTemplatesCount" />
          <app-config-stat :icon="TablerIconConstants.budget" :name="$t('settings.setup.budgets')" :value="budgetsCount" :muted="!profileStore.budgetsEnabled" />
          <app-config-stat :icon="TablerIconConstants.piggyBank" :name="$t('settings.setup.piggy_banks')" :value="piggyBanksCount" :muted="!profileStore.piggyBanksEnabled" />
          <app-config-stat
            :icon="TablerIconConstants.recurringTransaction"
            :name="$t('settings.setup.recurring_transactions')"
            :value="recurringTransactionsCount"
            :muted="!profileStore.recurringTransactionsEnabled"
          />
          <app-config-stat :icon="TablerIconConstants.lastSync" :name="$t('settings.setup.last_sync')" :value="lastSync" />
        </van-grid>
      </van-cell-group>

      <app-button-form-save />
    </van-form>

    <van-dialog v-model:show="showHeadersDialog" :title="$t('settings.setup.http_headers')" :confirm-button-text="$t('ok')" width="100%" style="margin: 20px; max-height: 500px">
      <div class="p-20 overflow-auto" style="max-height: 400px">
        <div class="display-flex font-600 text-size-13">
          <div class="flex-1">{{ $t('settings.setup.http_header_key') }}</div>
          <div class="flex-1">{{ $t('settings.setup.http_header_value') }}</div>
        </div>
        <app-repeater v-model="picoBackendHeaders" :empty-item="{ key: '', value: '' }" :is-draggable="false">
          <template #content="{ element }">
            <div class="display-flex gap-1 mb-2">
              <app-field v-model="element.key" class="flex-1 p-0" :placeholder="$t('settings.setup.http_header_key')" />
              <app-field v-model="element.value" class="flex-1 p-0" :placeholder="$t('settings.setup.http_header_value')" />
            </div>
          </template>
        </app-repeater>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/stores/profileStore'
import { useDashboardStore } from '~/stores/dashboardStore'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import { useTemplateStore } from '~/stores/templateStore'
import UIUtils from '~/utils/UIUtils'
import SettingsTokenField from '~/components/settings/settings-token-field.vue'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

import AppConfigStat from '~/components/settings/app-config-stat.vue'
import UserRepository from '~/repository/UserRepository'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { cloneDeep, get } from 'lodash-es'
import { rule } from '~/utils/ValidationUtils.js'

const appStore = useAppStore()
const profileStore = useProfileStore()
const dashboardStore = useDashboardStore()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const budgetStore = useBudgetStore()
const piggyBankStore = usePiggyBankStore()
const recurringTransactionStore = useRecurringTransactionStore()
const templateStore = useTemplateStore()

const authToken = ref('')
const picoBackendURL = ref('')
const picoBackendHeaders = ref([])
const syncProfileInDB = ref(true)
const daysBetweenFullSync = ref(4)
const showHeadersDialog = ref(false)

const accountsCount = computed(() => accountStore.accountList.length)
const categoriesCount = computed(() => categoryStore.categoryList.length)
const tagsCount = computed(() => tagStore.tagList.length)
const budgetsCount = computed(() => budgetStore.budgetList.length)
const piggyBanksCount = computed(() => piggyBankStore.piggyBankList.length)
const recurringTransactionsCount = computed(() => recurringTransactionStore.recurringTransactionList.length)
const transactionTemplatesCount = computed(() => templateStore.transactionTemplateList.length)
const lastSync = computed(() => {
  return appStore.lastSync ? DateUtils.dateToUIWithTime(appStore.lastSync) : ' - '
})
const { t } = useI18n()

onMounted(() => {
  authToken.value = appStore.authToken
  picoBackendURL.value = appStore.picoBackendURL
  picoBackendHeaders.value = cloneDeep(appStore.picoBackendHeaders)
  syncProfileInDB.value = appStore.syncProfileInDB
  daysBetweenFullSync.value = appStore.daysBetweenFullSync
})

const onSave = async () => {
  picoBackendURL.value = picoBackendURL.value.endsWith('/') ? picoBackendURL.value.slice(0, -1) : picoBackendURL.value

  appStore.authToken = authToken.value
  appStore.picoBackendURL = picoBackendURL.value
  appStore.picoBackendHeaders = picoBackendHeaders.value.filter(({ key }) => key?.trim()).map(({ key, value }) => ({ key: key.trim(), value }))
  appStore.syncProfileInDB = syncProfileInDB.value
  appStore.daysBetweenFullSync = daysBetweenFullSync.value

  const userResponse = await new UserRepository().getUser()
  if (!ResponseUtils.isSuccess(userResponse)) {
    UIUtils.showToastError(t('settings.setup.invalid_endpoint'))
    return
  }

  const userId = get(userResponse, 'data.data.id')
  if (!userId) {
    UIUtils.showToastError(t('settings.setup.invalid_token'))
    return
  }

  await appStore.syncEverything()
  UIUtils.showToastSuccess(t('settings.settings_saved'))
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.setup.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS,
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
