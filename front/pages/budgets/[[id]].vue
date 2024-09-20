<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" @submit="saveItem" @failed="onValidationError" class="">

      <app-card-info v-if="itemId">
        <div class="van-cell-group-title">Status:</div>
        <div class="px-3 pb-15 flex-column text-size-12">
          <div>Spent: {{ budgetLimitSpent }} / {{ amount }}</div>
          <div>Percent: {{ budgetLimitPercent }}</div>
          <div>Interval: {{ budgetLimitInterval }}</div>
        </div>
        <app-field-link label="Show transactions" :icon="TablerIconConstants.transaction" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTION_FIELDS_ORDER)" />

      </app-card-info>


      <van-cell-group inset>
        <app-field
          v-model="name"
          name="Name"
          label="Name"
          rows="1"
          autosize
          :icon="TablerIconConstants.fieldText2"
          placeholder="Description"
          :rules="[{ required: true, message: 'Name is required' }]"
        />

        <icon-select v-model="icon" />

        <budget-type-select v-model="type" :rules="[{ required: true, message: 'Type is required' }]" required />

        <template v-if="isPeriodVisible">
          <budget-period-select v-model="period" :rules="[{ required: true, message: 'Type is required' }]" required />
          <currency-select v-model="currency" :rules="[{ required: true, message: 'Field is required' }]" required />
          <app-field v-model="amount" name="Amount" label="Amount" placeholder="Amount" :icon="TablerIconConstants.cashBanknote" :rules="[{ required: true, message: 'Amount is required' }]" />
        </template>
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

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const dataStore = useDataStore()
  item.value = dataStore.budgetDictionary[itemId.value]
}

const isPeriodVisible = computed(() => get(type.value, 'fireflyCode') !== Budget.types.manual.fireflyCode)

const budgetLimit = computed(() => Budget.getLimit(item.value))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitInterval = computed(() => BudgetLimit.getLimitInterval(budgetLimit.value))

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

let { itemId, item, isEmpty, title, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError } = useForm({
  form: form,
  titleAdd: 'Add budget',
  titleEdit: 'Edit budget',
  routeList: RouteConstants.ROUTE_BUDGET_LIST,
  routeForm: RouteConstants.ROUTE_BUDGET_ID,
  model: new Budget(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { name, icon, type, period, currency, amount } = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'icon', parentKey: `attributes.icon` },
  { computed: 'type', parentKey: `attributes.auto_budget_type` },
  { computed: 'period', parentKey: `attributes.auto_budget_period` },
  { computed: 'currency', parentKey: `attributes.currency` },
  { computed: 'amount', parentKey: `attributes.amount` },
])

watch(name, (newValue) => {
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  name.value = newValue
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_BUDGET_LIST,
})
</script>
