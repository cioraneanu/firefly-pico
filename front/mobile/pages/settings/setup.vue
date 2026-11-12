<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card>
          <app-field v-model="picoBackendURL" name="picoBackendURL" inputmode="url" :label="$t('settings.setup.pico_backend_url')" :rules="[rule.required()]">
            <template #left-icon>
              <app-icon :icon="IconWorld" :size="16" :stroke="2" />
            </template>
          </app-field>

          <settings-token-field v-model="authToken" required />

          <button type="button" class="mx-btn out mx-btn-block" @click="showHeadersSheet = true">
            <app-icon :icon="IconWebhook" :size="16" :stroke="2" />
            <span>{{ $t('settings.setup.http_headers') }}{{ headersCount ? ` · ${headersCount}` : '' }}</span>
          </button>

          <button type="button" class="mx-btn out mx-btn-block" :disabled="isTesting" @click="testConnection({ picoBackendURL, authToken, picoBackendHeaders })">
            <span v-if="isTesting" class="mx-spin" />
            <app-icon v-else :icon="IconPlugConnected" :size="16" :stroke="2" />
            <span>{{ $t('settings.setup.test_connection') }}</span>
          </button>

          <div class="mx-hr" />
          <app-boolean v-model="syncProfileInDB" :label="$t('settings.setup.sync_settings_via_token')" />
          <div class="mx-hr" />

          <app-field v-model="daysBetweenFullSync" name="daysBetweenFullSync" type="digit" :label="$t('settings.setup.days_between_sync')" :rules="[rule.required()]">
            <template #left-icon>
              <app-icon :icon="IconCalendarRepeat" :size="16" :stroke="2" />
            </template>
          </app-field>
        </app-card>

        <app-card-info>
          <app-field-link :label="$t('settings.setup.enabled_resources')" :icon="IconToggleRight" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_ENABLED_RESOURCES)" />
        </app-card-info>

        <app-card :section="$t('settings.setup.loaded_data_stats')" :form="false">
          <div class="mx-card__c">
            <div class="mx-kv">
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
            </div>
          </div>
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>

    <app-sheet v-model:show="showHeadersSheet" :title="$t('settings.setup.http_headers')">
      <div class="mx-form">
        <div v-if="picoBackendHeaders.length" class="mx-hdr-h">
          <span>{{ $t('settings.setup.http_header_key') }}</span>
          <span>{{ $t('settings.setup.http_header_value') }}</span>
          <span />
        </div>
        <div v-for="(header, index) in picoBackendHeaders" :key="index" class="mx-hdr">
          <label class="mx-in">
            <input v-model="header.key" type="text" :placeholder="$t('settings.setup.http_header_key')" :aria-label="$t('settings.setup.http_header_key')" />
          </label>
          <label class="mx-in">
            <input v-model="header.value" type="text" :placeholder="$t('settings.setup.http_header_value')" :aria-label="$t('settings.setup.http_header_value')" />
          </label>
          <button type="button" class="mx-ib sm" :aria-label="$t('delete')" @click="picoBackendHeaders.splice(index, 1)">
            <app-icon :icon="IconTrash" :size="16" :stroke="2" />
          </button>
        </div>
        <button type="button" class="mx-btn dash mx-btn-block" @click="picoBackendHeaders.push({ key: '', value: '' })">
          <app-icon :icon="IconPlus" :size="16" :stroke="2" />
          <span>{{ $t('settings.setup.add_http_header') }}</span>
        </button>
        <div class="mx-d">{{ $t('settings.setup.http_headers_info') }}</div>
      </div>

      <template #footer>
        <button type="button" class="mx-btn pri" @click="showHeadersSheet = false">{{ $t('done') }}</button>
      </template>
    </app-sheet>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileStore } from '~/core/stores/profileStore'
import { useAccountStore } from '~/core/stores/accountStore'
import { useCategoryStore } from '~/core/stores/categoryStore'
import { useTagStore } from '~/core/stores/tagStore'
import { useBudgetStore } from '~/core/stores/budgetStore'
import { usePiggyBankStore } from '~/core/stores/piggyBankStore'
import { useRecurringTransactionStore } from '~/core/stores/recurringTransactionStore'
import { useTemplateStore } from '~/core/stores/templateStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import UserRepository from '~/core/repository/UserRepository'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { cloneDeep, get } from 'lodash-es'
import { rule } from '~/core/utils/ValidationUtils.js'
import { IconCalendarRepeat, IconPlugConnected, IconPlus, IconToggleRight, IconTrash, IconWebhook, IconWorld } from '@tabler/icons-vue'

const appStore = useAppStore()
const profileStore = useProfileStore()
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
const showHeadersSheet = ref(false)
const { testConnection, isTesting } = useConnectionTest()

const headersCount = computed(() => picoBackendHeaders.value.filter(({ key }) => key?.trim()).length)
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
  picoBackendHeaders.value = cloneDeep(appStore.picoBackendHeaders ?? [])
  syncProfileInDB.value = appStore.syncProfileInDB
  daysBetweenFullSync.value = appStore.daysBetweenFullSync
})

const onSave = async () => {
  picoBackendURL.value = picoBackendURL.value.endsWith('/') ? picoBackendURL.value.slice(0, -1) : picoBackendURL.value
  authToken.value = authToken.value.trim().replace(/^Bearer\s+/i, '')

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

  await appStore.fetchInfo()
  await appStore.syncEverything()
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
