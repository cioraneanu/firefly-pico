<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-10" />

    <transaction-assistant v-if="!itemId" @change="onAssistant" @keyup.enter="saveItem" v-model="assistantText" />

    <transaction-type-tabs v-model="type" class="mx-3 mt-1 mb-1" />

    <van-form :disabled="isSplitTransaction" :name="formName" class="transaction-form-group" ref="form" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset class="mt-0 flex-column display-flex">
        <div v-if="isSplitTransaction" class="display-flex ml-3 mt-3">
          <transaction-split-badge />
        </div>

        <transaction-amount-field
          v-model:amount="amount"
          v-model:amountForeign="amountForeign"
          v-model:currencyForeign="amountForeign"
          :currency="sourceCurrency"
          :isForeignAmountVisible="isForeignAmountVisible"
          ref="refAmount"
          name="amount"
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_AMOUNT)"
          :disabled="isSplitTransaction"
        />

        <account-select
          v-model="accountSource"
          label="Source account"
          :allowed-types="accountSourceAllowedTypes"
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_SOURCE_ACCOUNT)"
          v-bind="accountSourceBinding"
        >
          <template #label>
            <div class="flex-center-vertical gap-1">
              <div class="flex-1">Source account</div>
              <van-button v-if="showSourceAccountSuggestion" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)" size="mini" class="suggestion-button"
                >Set your default
              </van-button>
            </div>
          </template>
        </account-select>

        <account-select
          v-model="accountDestination"
          label="Destination account"
          :allowed-types="accountDestinationAllowedTypes"
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESTINATION_ACCOUNT)"
          v-bind="accountDestinationBinding"
        />

        <category-select v-model="category" :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_CATEGORY)" />

        <app-field
          v-model="description"
          label="Description"
          name="description"
          type="textarea"
          rows="1"
          autosize
          :icon="TablerIconConstants.fieldText2"
          placeholder="Description"
          :rules="[{ required: true, message: 'Description is required' }]"
          required
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESCRIPTION)"
        />

        <tag-select v-model="tags" :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_TAG)" />

        <div :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DATE)">
          <app-date-time-grid v-model="date" name="date" :rules="[{ required: true, message: 'Date is required' }]" required />

          <div v-if="!isSplitTransaction" class="px-3 flex-center-vertical gap-1">
            <van-button size="small" @click="onSubDay">-1 day</van-button>
            <van-button size="small" @click="onToday">Today</van-button>
            <van-button size="small" @click="onAddDay">+1 day</van-button>
          </div>
        </div>

        <app-field
          v-model="notes"
          :icon="TablerIconConstants.fieldText1"
          label="Notes"
          placeholder="No notes..."
          type="textarea"
          rows="1"
          autosize
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_NOTES)"
        />

        <budget-select v-model="budget" :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_BUDGET)" />
      </van-cell-group>

      <div style="margin: 16px; position: relative">
        <app-button-form-delete class="mt-10" v-if="itemId && !isSplitTransaction" @click="onDelete" />

        <div class="display-flex gap-1">
          <van-button v-if="itemId && !isSplitTransaction" @click="onCreateClone" block type="default" class="mt-2 flex-1">
            <app-icon :icon="TablerIconConstants.clone" />
            Clone
          </van-button>

          <van-button v-if="itemId && !isSplitTransaction" @click="onCreateTransactionTemplate" block type="default" class="mt-2 flex-1">
            <app-icon :icon="TablerIconConstants.transactionTemplate" />
            Make template
          </van-button>
        </div>
      </div>

      <app-button-form-save v-if="!isSplitTransaction" />
    </van-form>

    <app-card-info style="order: 99">
      <app-field-link label="Configure fields" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FIELDS_ORDER)" />
    </app-card-info>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _, { get, head, isEqual } from 'lodash'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import Account from '~/models/Account'
import { generateChildren } from '~/utils/VueUtils'
import Transaction from '~/models/Transaction'
import { useToolbar } from '~/composables/useToolbar'
import TagSelect from '~/components/select/tag-select.vue'
import Category from '~/models/Category'
import { FORM_CONSTANTS_TRANSACTION_FIELDS } from '~/constants/FormConstants'
import Tag from '~/models/Tag'
import { isStringEmpty } from '~/utils/DataUtils'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { animateTransactionForm } from '~/utils/AnimationUtils.js'
import tag from '~/models/Tag'
import { addDays, endOfMonth, startOfMonth } from 'date-fns'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import TransactionSplitBadge from '~/components/transaction/transaction-split-badge.vue'

const refAmount = ref(null)

// ------------------------------------

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)
const assistantText = ref('')

let { itemId, item, isEmpty, title, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  titleAdd: 'Add transaction',
  titleEdit: 'Edit transaction',
  routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
  model: new Transaction(),
  resetFields: () => {
    assistantText.value = ''
  },
})


const pathKey = 'attributes.transactions.0'
const { amount, amountForeign, date, tags, description, notes, budget, accountSource, accountDestination, category, type, foreignCurrency } = generateChildren(item, [
  { computed: 'amount', parentKey: `${pathKey}.amount` },
  { computed: 'amountForeign', parentKey: `${pathKey}.amountForeign` },
  { computed: 'date', parentKey: `${pathKey}.date` },
  { computed: 'tags', parentKey: `${pathKey}.tags` },
  { computed: 'description', parentKey: `${pathKey}.description` },
  { computed: 'notes', parentKey: `${pathKey}.notes` },
  { computed: 'accountSource', parentKey: `${pathKey}.accountSource` },
  { computed: 'accountDestination', parentKey: `${pathKey}.accountDestination` },
  { computed: 'category', parentKey: `${pathKey}.category` },
  { computed: 'type', parentKey: `${pathKey}.type` },
  { computed: 'budget', parentKey: `${pathKey}.budget` },
  { computed: 'foreignCurrency', parentKey: `${pathKey}.foreignCurrency` },
])

const transactions = computed(() => _.get(item.value, 'attributes.transactions', []))
const isSplitTransaction = computed(() => transactions.value.length > 1)
const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))

// ------------------------------------

const sourceCurrency = computed(() => Account.getCurrency(accountSource.value))

const isForeignAmountVisible = computed(() => {
  // TODO: Write me later
  return true
  // return accountSource.value && currencyForeignId.value && sourceCurrency.value.id !== currencyForeignId.value
})

//

// ----- Custom logic -----

const onSubDay = () => {
  date.value = addDays(date.value, -1)
}

const onToday = () => {
  const today = new Date()
  let newDate = new Date(date.value)
  newDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate())
  date.value = newDate
}

const onAddDay = () => {
  date.value = addDays(date.value, 1)
}

const onCreateTransactionTemplate = async () => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}?transaction_id=${itemId.value}`)
}
const onCreateClone = async () => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}?transaction_id=${itemId.value}`)
}

const onTransactionTemplateSelected = (transactionTemplate) => {
  if (!transactionTemplate) {
    item.value = new Transaction().getEmpty()
    return
  }
  type.value = transactionTemplate.type
  amount.value = transactionTemplate.amount
  if (!accountSource.value) {
    accountSource.value = dataStore.accountDictionary[transactionTemplate.account_source_id]
  }

  if (!accountDestination.value) {
    accountDestination.value = dataStore.accountDictionary[transactionTemplate.account_destination_id]
  }
  description.value = transactionTemplate.description
  category.value = transactionTemplate.category
  notes.value = transactionTemplate.notes
  tags.value = transactionTemplate.tags
}

watch(category, async (newValue) => {
  if (!profileStore.copyCategoryToDescription || !isStringEmpty(description.value) || itemId.value || !newValue) {
    return
  }
  description.value = Category.getDisplayName(newValue)
})

watch(tags, async (newValue) => {
  if (itemId.value || !newValue) {
    return
  }

  // Give child tags more priority for more granularity
  const sortedTagNames = sortByPath(newValue, 'level', false).map((tag) => Tag.getDisplayNameEllipsized(tag).toLowerCase())

  if (profileStore.copyTagToDescription && isStringEmpty(description.value)) {
    // The first one is the one with the highest level
    description.value = head(sortedTagNames) ?? ''
  }

  if (profileStore.copyTagToCategory && !category.value) {
    for (let tagName of sortedTagNames) {
      let foundCategory = dataStore.categoryList.find((category) => {
        let categoryName = Category.getDisplayName(category).toLowerCase()

        return tagName === categoryName
      })
      if (foundCategory) {
        category.value = foundCategory
        break
      }
    }
  }
})

const resetFormFields = () => {
  accountSource.value = isTypeIncome.value ? profileStore.defaultAccountDestination : profileStore.defaultAccountSource
  accountDestination.value = isTypeIncome.value ? profileStore.defaultAccountSource : profileStore.defaultAccountDestination
  tags.value = []
  category.value = null
  description.value = ''
}

const onAssistant = async ({ tag: newTag, category: newCategory, transactionTemplate: transactionTemplate, amount: newAmount, description: newDescription, isTodo: newIsTodo }) => {
  resetFormFields()

  if (newTag) {
    tags.value = Tag.getTagWithParents(newTag)
  }

  if (newIsTodo && dataStore.tagTodo) {
    tags.value = [...tags.value, dataStore.tagTodo]
  }

  if (newCategory) {
    category.value = newCategory
  }

  if (transactionTemplate) {
    onTransactionTemplateSelected(transactionTemplate)
  } else {
    type.value = Transaction.types.expense
  }

  if (newAmount) {
    amount.value = newAmount
  }

  if (newDescription) {
    description.value = newDescription
  }
}

const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

const getStyleForField = (fieldCode) => {
  let position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === fieldCode)
  let field = profileStore.transactionOrderedFieldsList.find((item) => item.code === fieldCode)
  let isVisible = field ? field.isVisible : true
  let displayStyle = isVisible ? '' : 'display: none'

  if (isTypeExpense.value) {
    return `order: ${position}; ${displayStyle}`
  }

  const fieldTypeAccountsList = [FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_SOURCE_ACCOUNT, FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESTINATION_ACCOUNT]

  // Should be same as income, but reverse the position on source with destination
  if (isTypeIncome.value) {
    let position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === fieldCode)
    if (fieldCode === FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_SOURCE_ACCOUNT) {
      position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESTINATION_ACCOUNT)
    }
    if (fieldCode === FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESTINATION_ACCOUNT) {
      position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_SOURCE_ACCOUNT)
    }
    return `order: ${position}; ${displayStyle}`
  }

  // Transfers
  if (isTypeTransfer.value) {
    if (fieldTypeAccountsList.includes(fieldCode)) {
      return `order: 0`
    }
    let position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === fieldCode)
    return `order: ${position}; ${displayStyle}`
  }

  // No order overwrite, just respect the HTML order
  return `order: 1`
}

const accountSourceBinding = computed(() => {
  const isRequired = isTypeExpense.value || isTypeTransfer.value
  return {
    required: isRequired,
    rules: isRequired ? [{ required: true, message: 'Source account is required!' }] : [],
  }
})

const accountDestinationBinding = computed(() => {
  const isRequired = isTypeIncome.value || isTypeTransfer.value
  return {
    required: isRequired,
    rules: isRequired ? [{ required: true, message: 'Destination account is required!' }] : [],
  }
})

watch(type, (newValue, oldValue) => {
  // Only when creating a transaction
  if (itemId.value) {
    return
  }
  // For type income we should reverse the accounts
  if (newValue?.code === Transaction.types.income.code || oldValue?.code === Transaction.types.income.code) {
    let temp = accountSource.value
    accountSource.value = accountDestination.value
    accountDestination.value = temp
  }
})

watch(description, (newValue) => {
  if (profileStore.lowerCaseTransactionDescription) {
    newValue = newValue.toLowerCase()
  }
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  description.value = newValue
})

const showSourceAccountSuggestion = computed(() => !profileStore.defaultAccountSource && !accountSource.value)

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_TRANSACTION_LIST,
})

onMounted(async () => {
  animateTransactionForm()
  cloneTransactions()
})

const cloneTransactions = async () => {
  const cloneId = get(route.query, 'transaction_id')
  if (!cloneId) {
    return
  }

  let cloneItem = await new TransactionRepository().getOne(cloneId)
  cloneItem = TransactionTransformer.transformFromApi(cloneItem.data)
  cloneItem = get(cloneItem, 'attributes.transactions.0')
  if (!cloneItem) {
    return
  }

  amount.value = cloneItem.amount
  description.value = cloneItem.description
  notes.value = cloneItem.notes
  accountSource.value = cloneItem.accountSource
  accountDestination.value = cloneItem.accountDestination
  category.value = cloneItem.category
  tags.value = cloneItem.tags
  budget.value = cloneItem.budget
}
</script>

<style></style>
