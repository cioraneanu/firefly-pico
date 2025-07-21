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
          <div>{{ $t('budget_page.spent') }}: {{ budgetLimitSpent }} / {{ budgetLimitAmount }} {{ budgetCurrencySymbol }}</div>
          <div>{{ $t('budget_page.percent') }}: {{ budgetLimitPercent }} %</div>
          <div>{{ $t('budget_page.interval') }}: {{ budgetLimitInterval }}</div>
        </div>
        <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="name" name="Name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />

        <budget-type-select v-model="type" name="budgetType" :rules="[rule.required()]" required />

        <template v-if="isPeriodVisible">
          <budget-period-select v-model="period" name="budgetPeriod" :rules="[rule.required()]" required />
          <currency-select v-model="currency" name="currency" :rules="[rule.required()]" required />
          <app-field v-model="amount" name="amount" :label="$t('amount')" :icon="TablerIconConstants.cashBanknote" :rules="[rule.required()]" />
        </template>

        <app-boolean v-model="active" :label="$t('active')" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _, { get } from 'lodash'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import Budget from '~/models/Budget.js'
import AccountTypeSelect from '~/components/select/account/account-type-select.vue'
import BudgetLimit from '~/models/BudgetLimit.js'
import { rule } from '~/utils/ValidationUtils.js'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const dataStore = useDataStore()
  item.value = dataStore.budgetDictionary[useRoute().params.id]
}

const isPeriodVisible = computed(() => get(type.value, 'fireflyCode') !== Budget.types.manual.fireflyCode)

const budgetLimit = computed(() => Budget.getLimit(item.value))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0).toFixed(2))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitAmount = computed(() => get(budgetLimit.value, `attributes.amount`) ?? 0)
const budgetLimitInterval = computed(() => BudgetLimit.getLimitInterval(budgetLimit.value))
const budgetCurrencySymbol = computed(() => Budget.getCurrencySymbol(item.value))

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = BudgetTransformer.transformFromApi(newItem)
    dataStore.budgetList = [newItem, ...dataStore.budgetList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    dataStore.budgetList = dataStore.budgetList.filter((item) => item.id !== itemId.value)
  }
}

let { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_BUDGET_LIST,
  routeForm: RouteConstants.ROUTE_BUDGET_ID,
  model: new Budget(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { name, icon, type, period, currency, amount, active } = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'icon', parentKey: `attributes.icon` },
  { computed: 'type', parentKey: `attributes.auto_budget_type` },
  { computed: 'period', parentKey: `attributes.auto_budget_period` },
  { computed: 'currency', parentKey: `attributes.currency` },
  { computed: 'amount', parentKey: `attributes.amount` },
  { computed: 'active', parentKey: `attributes.active` },
])

watch(name, (newValue) => {
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  name.value = newValue
})

const onNavigateToTransactionsList = async () => {
  let filters = TransactionFilterUtils.filters.budget.toUrl(item.value)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
}

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('budget_page.title_edit') : t('budget_page.title_add'),
  backRoute: RouteConstants.ROUTE_BUDGET_LIST,
})
</script>
