<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <transaction-type-tabs v-model="type" class="mx-3 mt-3 mb-2" />

    <!--    @submit="onSave"-->
    <van-form ref="form" :name="formName" class="transaction-form-group" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="name" :icon="TablerIconConstants.fieldText2" :label="$t('name')" name="name" required :rules="[rule.required()]" />

        <div class="van-cell-fake flex-column van-cell">
          <span>{{ $t('transaction_template_page.extra_names') }}</span>
          <app-repeater v-model="extra_names" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <app-field placeholder="Name" v-model="element.value" class="compact" :name="`extra-name-${index}`" required :rules="[rule.required()]" />
            </template>
          </app-repeater>
        </div>

        <transaction-amount-field v-model:amount="amount" ref="refAmount" />

        <account-select v-model="account_source" :label="$t('transaction.source_account')" :allowed-types="accountSourceAllowedTypes" />

        <account-select v-model="account_destination" :label="$t('transaction.destination_account')" :allowed-types="accountDestinationAllowedTypes" />

        <app-field v-model="description" :label="$t('description')" :icon="TablerIconConstants.fieldText2" type="textarea" rows="1" autosize placeholder="Description" />

        <category-select v-model="category" />

        <tag-select v-model="tags" />

        <budget-select v-model="budget" />


        <app-field v-model="notes" :label="$t('notes')" type="textarea" :icon="TablerIconConstants.fieldText1" rows="1" autosize />
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
import Account from '~/models/Account'
import { generateChildren } from '~/utils/VueUtils'
import TransactionTemplate from '~/models/TransactionTemplate'
import { useToolbar } from '~/composables/useToolbar'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import { areIntEqual } from '~/utils/DataUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { rule } from '~/utils/ValidationUtils.js'
import { transactionFormField } from '~/constants/TransactionConstants.js'

const refAmount = ref(null)

// ------------------------------------

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()
const { t } = useI18n()

const form = ref(null)

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = TransactionTemplateTransformer.transformFromApi(newItem)
    dataStore.transactionTemplateList = [newItem, ...dataStore.transactionTemplateList.filter((item) => !areIntEqual(item.id, itemId.value))]
  }
  if (event === 'onPostDelete') {
    dataStore.transactionTemplateList = dataStore.transactionTemplateList.filter((item) => !areIntEqual(item.id, itemId.value))
  }
}

let { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
  model: new TransactionTemplate(),
  onEvent: onEvent,
})

const voicesList = ref([])

const { name, extra_names, amount, tags, description, notes, account_source, account_destination, category, type, budget } = generateChildren(item, [
  { computed: 'type', parentKey: `type` },
  { computed: 'name', parentKey: `name` },
  { computed: 'extra_names', parentKey: `extra_names` },
  { computed: 'amount', parentKey: `amount` },
  { computed: 'budget', parentKey: `budget` },
  { computed: 'description', parentKey: `description` },
  { computed: 'notes', parentKey: `notes` },
  { computed: 'account_source', parentKey: `account_source` },
  { computed: 'account_destination', parentKey: `account_destination` },
  { computed: 'category', parentKey: `category` },
  { computed: 'tags', parentKey: `tags` },
])

const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))

// ----- Custom logic -----

onMounted(async () => {
  const sourceTransactionId = get(route.query, 'transaction_id')
  if (!sourceTransactionId) {
    return
  }

  let sourceTransaction = await new TransactionRepository().getOne(sourceTransactionId)
  sourceTransaction = TransactionTransformer.transformFromApi(sourceTransaction.data)
  sourceTransaction = get(sourceTransaction, 'attributes.transactions.0')
  if (!sourceTransaction) {
    return
  }

  amount.value = sourceTransaction.amount
  description.value = sourceTransaction.description
  notes.value = sourceTransaction.notes
  account_source.value = sourceTransaction.accountSource
  account_destination.value = sourceTransaction.accountDestination
  category.value = sourceTransaction.category
  tags.value = sourceTransaction.tags
  budget.value = sourceTransaction.budget
})

const toolbar = useToolbar()
toolbar.init({
  title: itemId.value ? t('transaction_template_page.title_edit') : t('transaction_template_page.title_add'),
  backRoute: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
})
</script>
