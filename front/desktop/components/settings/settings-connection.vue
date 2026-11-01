<template>
  <d-form class="[--label-w:13rem]" @submit="save">
    <d-settings-group>
      <d-field :label="$t('settings.setup.pico_backend_url')" :rules="[rule.required()]" :value="connection.picoBackendURL">
        <d-input v-model="connection.picoBackendURL" :icon="IconLink" />
      </d-field>
      <d-field :label="$t('settings.token.label')" :rules="[rule.required()]" :value="connection.authToken">
        <d-input v-model="connection.authToken" :type="isTokenVisible ? 'text' : 'password'" :icon="IconKey" :placeholder="$t('settings.token.placeholder')">
          <d-button variant="ghost" size="icon-xs" :icon="isTokenVisible ? IconEyeOff : IconEye" class="mr-1 text-dim" @click.prevent="isTokenVisible = !isTokenVisible" />
        </d-input>
      </d-field>
      <d-field :label="$t('settings.setup.http_headers')" top>
        <div class="flex flex-col gap-2">
          <div v-for="(header, index) in connection.picoBackendHeaders" :key="index" class="grid grid-cols-[1fr_1fr_auto] gap-2">
            <d-input v-model="header.key" :placeholder="$t('settings.setup.http_header_key')" />
            <d-input v-model="header.value" :placeholder="$t('settings.setup.http_header_value')" />
            <d-button variant="ghost" size="icon" :icon="IconTrash" class="text-dim" @click="connection.picoBackendHeaders.splice(index, 1)" />
          </div>
          <d-button size="sm" :icon="IconPlus" class="self-start" @click="connection.picoBackendHeaders.push({ key: '', value: '' })">{{ $t('add') }}</d-button>
        </div>
      </d-field>
      <d-field :label="$t('settings.setup.sync_settings_via_token')">
        <d-switch v-model="connection.syncProfileInDB" />
      </d-field>
      <d-field :label="$t('settings.setup.days_between_sync')" :rules="[rule.required()]" :value="connection.daysBetweenFullSync">
        <d-input v-model="connection.daysBetweenFullSync" type="number" min="0" class="w-30" />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.setup.enabled_resources')">
      <div class="grid grid-cols-2 gap-x-6">
        <d-switch v-for="resource in resources" :key="resource.path" v-model="draft[resource.path]">{{ $t(resource.t) }}</d-switch>
      </div>
    </d-settings-group>

    <d-settings-group :title="$t('settings.setup.loaded_data_stats')">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
        <d-dash-tile v-for="stat in stats" :key="stat.t" :label="$t(stat.t)" :value="stat.value" :icon="stat.icon" />
      </div>
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @save="save" @reset="reset">
      <d-button variant="ghost" :icon="IconRefresh" :loading="isSyncing" class="ml-auto" @click="sync">{{ $t('desktop.sync_now') }}</d-button>
    </d-settings-actions>
  </d-form>
</template>

<script setup>
import {
  IconBasket,
  IconCalendarRepeat,
  IconCategory,
  IconCloudDown,
  IconCreditCard,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLink,
  IconPigMoney,
  IconPlus,
  IconRefresh,
  IconTag,
  IconTemplate,
  IconTrash,
} from '@tabler/icons-vue'
import { cloneDeep, get } from 'lodash-es'
import UserRepository from '~/core/repository/UserRepository'
import { rule } from '~/core/utils/ValidationUtils'

const { t } = useI18n()
const appStore = useAppStore()
const isTokenVisible = ref(false)
const isSyncing = ref(false)
const isVerifying = ref(false)

const resources = [
  { path: 'budgetsEnabled', t: 'settings.setup.enable_budgets' },
  { path: 'categoriesEnabled', t: 'settings.setup.enable_categories' },
  { path: 'tagsEnabled', t: 'settings.setup.enable_tags' },
  { path: 'piggyBanksEnabled', t: 'settings.setup.enable_piggy_banks' },
  { path: 'recurringTransactionsEnabled', t: 'settings.setup.enable_recurring_transactions' },
]

const {
  draft,
  save: saveProfile,
  reset: resetProfile,
  isSaving: isSavingProfile,
} = useSettingsDraft(
  resources.map((resource) => resource.path),
  { onSaved: () => Promise.all([appStore.fetchInfo(), appStore.syncEverything()]) },
)

const connectionKeys = ['authToken', 'picoBackendURL', 'picoBackendHeaders', 'syncProfileInDB', 'daysBetweenFullSync']
const connection = reactive({})
const resetConnection = () => connectionKeys.forEach((key) => (connection[key] = cloneDeep(appStore[key])))
resetConnection()

const isSaving = computed(() => isVerifying.value || isSavingProfile.value)

const stats = computed(() => [
  { t: 'settings.setup.account', value: useAccountStore().accountList.length, icon: IconCreditCard },
  { t: 'settings.setup.categories', value: useCategoryStore().categoryList.length, icon: IconCategory },
  { t: 'settings.setup.tags', value: useTagStore().tagList.length, icon: IconTag },
  { t: 'settings.setup.templates', value: useTemplateStore().transactionTemplateList.length, icon: IconTemplate },
  { t: 'settings.setup.budgets', value: useBudgetStore().budgetList.length, icon: IconBasket },
  { t: 'settings.setup.piggy_banks', value: usePiggyBankStore().piggyBankList.length, icon: IconPigMoney },
  { t: 'settings.setup.recurring_transactions', value: useRecurringTransactionStore().recurringTransactionList.length, icon: IconCalendarRepeat },
  { t: 'settings.setup.last_sync', value: appStore.lastSync ? DateUtils.dateToUIWithTime(appStore.lastSync) : '-', icon: IconCloudDown },
])

const reset = () => {
  resetConnection()
  resetProfile()
}

const save = async () => {
  isVerifying.value = true
  Object.assign(appStore, {
    picoBackendURL: connection.picoBackendURL.replace(/\/$/, ''),
    authToken: connection.authToken.trim().replace(/^Bearer\s+/i, ''),
    picoBackendHeaders: connection.picoBackendHeaders.filter(({ key }) => key?.trim()).map(({ key, value }) => ({ key: key.trim(), value })),
    syncProfileInDB: connection.syncProfileInDB,
    daysBetweenFullSync: connection.daysBetweenFullSync,
  })
  const response = await new UserRepository().getUser()
  isVerifying.value = false
  if (!ResponseUtils.isSuccess(response)) return UIUtils.showToastError(t('settings.setup.invalid_endpoint'))
  if (!get(response, 'data.data.id')) return UIUtils.showToastError(t('settings.setup.invalid_token'))
  resetConnection()
  await saveProfile()
}

const sync = async () => {
  isSyncing.value = true
  await appStore.syncEverything()
  isSyncing.value = false
}
</script>
