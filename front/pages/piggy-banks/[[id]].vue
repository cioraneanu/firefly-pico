<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" :name="formName" @submit="saveItem" @failed="onValidationError" class="">
      <app-card-info v-if="itemId">
        <div class="van-cell-group-title">{{ $t('status') }}:</div>
        <div class="px-3 pb-15 flex-column text-size-12">
          <div>{{ $t('piggy_bank_page.saved') }}: {{ piggyBankCurrentAmount }} / {{ piggyBankTargetAmount }} {{ piggyBankCurrencySymbol }}</div>
          <div>{{ $t('piggy_bank_page.percent') }}: {{ piggyBankPercent }} %</div>
          <div>{{ $t('piggy_bank_page.left_to_save') }}: {{ piggyBankLeftToSave }} {{ piggyBankCurrencySymbol }}</div>
        </div>
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="name" name="Name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />

        <account-select v-model="account" name="account" :allowed-types="accountAllowedTypes" :rules="[rule.required()]" required />

        <app-field v-model="targetAmount" name="targetAmount" :label="$t('piggy_bank_page.target_amount')" type="number" :icon="TablerIconConstants.cashBanknote" :rules="[rule.required()]" />
        <app-field v-model="currentAmount" name="currentAmount" :label="$t('piggy_bank_page.current_amount')" type="number" :icon="TablerIconConstants.cash" />

        <app-date v-model="startDate" :label="$t('piggy_bank_page.start_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />
        <app-date v-model="targetDate" :label="$t('piggy_bank_page.target_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />

        <app-field v-model="notes" name="notes" :label="$t('notes')" rows="2" autosize :icon="TablerIconConstants.description" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import _ from 'lodash-es'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import PiggyBankTransformer from '~/transformers/PiggyBankTransformer.js'
import PiggyBank from '~/models/PiggyBank.js'
import Account from '~/models/Account.js'
import { rule } from '~/utils/ValidationUtils.js'

const piggyBankStore = usePiggyBankStore()
const profileStore = useProfileStore()

const form = ref(null)

// Firefly III only allows piggy banks on asset and liability accounts
const accountAllowedTypes = [Account.types.asset, Account.types.liability]

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const piggyBankStore = usePiggyBankStore()
  item.value = piggyBankStore.piggyBankDictionary[useRoute().params.id]
}

const piggyBankCurrentAmount = computed(() => PiggyBank.getCurrentAmount(item.value))
const piggyBankTargetAmount = computed(() => PiggyBank.getTargetAmount(item.value))
const piggyBankPercent = computed(() => PiggyBank.getPercent(item.value).toFixed(2))
const piggyBankLeftToSave = computed(() => PiggyBank.getLeftToSave(item.value))
const piggyBankCurrencySymbol = computed(() => PiggyBank.getCurrencySymbol(item.value))

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = PiggyBankTransformer.transformFromApi(newItem)
    piggyBankStore.piggyBankList = [newItem, ...piggyBankStore.piggyBankList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    piggyBankStore.piggyBankList = piggyBankStore.piggyBankList.filter((item) => item.id !== itemId.value)
  }
}

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_PIGGY_BANK_LIST,
  routeForm: RouteConstants.ROUTE_PIGGY_BANK_ID,
  model: new PiggyBank(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { name, icon, account, targetAmount, currentAmount, startDate, targetDate, notes } = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'icon', parentKey: `attributes.icon` },
  { computed: 'account', parentKey: `attributes.account` },
  { computed: 'targetAmount', parentKey: `attributes.target_amount` },
  { computed: 'currentAmount', parentKey: `attributes.current_amount` },
  { computed: 'startDate', parentKey: `attributes.start_date` },
  { computed: 'targetDate', parentKey: `attributes.target_date` },
  { computed: 'notes', parentKey: `attributes.notes` },
])

watch(name, (newValue) => {
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  name.value = newValue
})

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('piggy_bank_page.title_edit') : t('piggy_bank_page.title_add'),
  backRoute: RouteConstants.ROUTE_PIGGY_BANK_LIST,
})
</script>
