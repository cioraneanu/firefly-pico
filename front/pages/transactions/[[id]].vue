<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-10" />

    <transaction-assistant v-if="!itemId && !isCloning" @change="onAssistant" @keyup.enter="saveItem" v-model="assistantText" />

    <transaction-type-tabs v-model="type" class="mx-3 mt-1 mb-1" />

    <van-form :disabled="isSplitTransaction" :name="formName" class="transaction-form-group" ref="form" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset class="mt-0 flex-column display-flex">
        <div v-if="isSplitTransaction" class="display-flex ml-3 mt-3">
          <transaction-split-badge />
        </div>

        <transaction-amount-field
          v-model:amount="amount"
          v-model:amountForeign="amountForeign"
          v-model:currencyForeign="currencyForeign"
          :currency="sourceCurrency"
          :isForeignAmountVisible="isForeignAmountVisible"
          name="amount"
          :style="getStyleForField(transactionFormField.amount)"
          :disabled="isSplitTransaction"
          :isAmountRequired="true"
        />

        <account-select
          v-model="accountSource"
          :label="$t('transaction.source_account')"
          :allowed-types="accountSourceAllowedTypes"
          :style="getStyleForField(transactionFormField.sourceAccount)"
          v-bind="accountSourceBinding"
        >
          <template #label>
            <div class="flex-center-vertical gap-1">
              <div class="flex-1">{{ $t('transaction.source_account') }}</div>
              <van-button v-if="showSourceAccountSuggestion" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)" size="mini" class="suggestion-button"
                >Set your default
              </van-button>
            </div>
          </template>
        </account-select>

        <account-select
          v-model="accountDestination"
          :label="$t('transaction.destination_account')"
          :allowed-types="accountDestinationAllowedTypes"
          :style="getStyleForField(transactionFormField.destinationAccount)"
          v-bind="accountDestinationBinding"
        />

        <category-select v-model="category" :style="getStyleForField(transactionFormField.category)" />

        <app-field
          v-model="description"
          :label="$t('description')"
          name="description"
          type="textarea"
          rows="1"
          autosize
          :icon="TablerIconConstants.fieldText2"
          placeholder="Description"
          :rules="[rule.required()]"
          required
          :style="getStyleForField(transactionFormField.description)"
        />

        <tag-select v-model="tags" :style="getStyleForField(transactionFormField.tags)" />

        <div :style="getStyleForField(transactionFormField.date)">
          <app-date-time-grid v-model="date" name="date" :rules="[rule.required()]" required />

          <div v-if="!isSplitTransaction" class="px-3 flex-center-vertical gap-1">
            <van-button size="small" @click="onSubDay">{{ $t('sub_day') }}</van-button>
            <van-button size="small" @click="onToday">{{ $t('today') }}</van-button>
            <van-button size="small" @click="onAddDay">{{ $t('add_day') }}</van-button>
          </div>
        </div>

        <transaction-note-field v-model="notes" :style="getStyleForField(transactionFormField.notes)" />

        <budget-select v-model="budget" :style="getStyleForField(transactionFormField.budget)" />

        <transaction-attachments-list :transaction="item" :style="getStyleForField(transactionFormField.attachments)" />
      </van-cell-group>

      <div style="margin: 16px; position: relative">
        <app-button-form-delete class="mt-10" v-if="itemId && !isSplitTransaction" @click="onDelete" />

        <div class="display-flex gap-1">
          <van-button v-if="itemId && !isSplitTransaction" @click="onCreateClone" block type="default" class="mt-2 flex-1">
            <app-icon :icon="TablerIconConstants.clone" />
            {{ $t('clone') }}
          </van-button>

          <van-button v-if="itemId && !isSplitTransaction" @click="onCreateTransactionTemplate" block type="default" class="mt-2 flex-1">
            <app-icon :icon="TablerIconConstants.transactionTemplate" />
            {{ $t('transaction.make_template') }}
          </van-button>
        </div>
      </div>

      <app-button-form-save v-if="!isSplitTransaction" />
    </van-form>

    <app-card-info style="order: 99">
      <app-field-link :label="$t('transaction.configure_fields')" :icon="TablerIconConstants.settings" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS)" />
    </app-card-info>
  </div>
</template>

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
import Tag from '~/models/Tag'
import { isStringEmpty } from '~/utils/DataUtils'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { animateTransactionAmountOperatorButtons, animateTransactionForm } from '~/utils/AnimationUtils.js'
import tag from '~/models/Tag'
import { addDays, endOfMonth, getHours, getMinutes, startOfMonth, startOfToday } from 'date-fns'
import TransactionRepository from '~/repository/TransactionRepository.js'
import TransactionTransformer from '~/transformers/TransactionTransformer.js'
import TransactionSplitBadge from '~/components/transaction/transaction-split-badge.vue'
import { useI18n } from '#imports'
import { transactionFormField } from '~/constants/TransactionConstants.js'
import { rule } from '~/utils/ValidationUtils.js'
import Currency from '~/models/Currency.js'
import TransactionNoteField from '~/components/transaction/transaction-note-field.vue'
import TransactionAttachmentsList from '~/components/transaction/transaction-attachements/transaction-attachments-list.vue'
import AttachmentRepository from '~/repository/AttachmentRepository.js'
import AttachmentTransformer from '~/transformers/AttachmentTransformer.js'

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)
const assistantText = ref('')

let { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
  model: new Transaction(),
  resetFields: () => {
    assistantText.value = ''
  },
})

const pathKey = 'attributes.transactions.0'
const { amount, amountForeign, date, tags, description, notes, budget, accountSource, accountDestination, category, type, currencyForeign } = generateChildren(item, [
  { computed: 'amount', parentKey: `${pathKey}.amount` },
  { computed: 'amountForeign', parentKey: `${pathKey}.amountForeign` },
  { computed: 'currencyForeign', parentKey: `${pathKey}.currencyForeign` },
  { computed: 'date', parentKey: `${pathKey}.date` },
  { computed: 'tags', parentKey: `${pathKey}.tags` },
  { computed: 'description', parentKey: `${pathKey}.description` },
  { computed: 'notes', parentKey: `${pathKey}.notes` },
  { computed: 'accountSource', parentKey: `${pathKey}.accountSource` },
  { computed: 'accountDestination', parentKey: `${pathKey}.accountDestination` },
  { computed: 'category', parentKey: `${pathKey}.category` },
  { computed: 'type', parentKey: `${pathKey}.type` },
  { computed: 'budget', parentKey: `${pathKey}.budget` },
])

const transactions = computed(() => _.get(item.value, 'attributes.transactions', []))
const isSplitTransaction = computed(() => transactions.value.length > 1)
const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))

// ------------------------------------

const sourceCurrency = computed(() => Account.getCurrency(accountSource.value))

const isForeignAmountVisible = computed(() => {
  let newTransactionWithDefaultCurrency = !itemId.value && (profileStore.defaultForeignCurrency || profileStore.isForeignCurrencyAlwaysVisible)
  let areTypeAssetsWithDifferentCurrencies =
    accountSource.value &&
    accountDestination.value &&
    Account.getType(accountSource.value)?.fireflyCode === Account.types.asset.fireflyCode &&
    Account.getType(accountDestination.value)?.fireflyCode === Account.types.asset.fireflyCode &&
    Account.getCurrency(accountSource.value)?.id !== Account.getCurrency(accountDestination.value)?.id
  return !!(newTransactionWithDefaultCurrency || areTypeAssetsWithDifferentCurrencies || currencyForeign.value || amountForeign.value)
})

//

// ----- Custom logic -----

const onSubDay = () => {
  date.value = addDays(date.value, -1)
}

const onToday = () => {
  let newDate = startOfToday()
  newDate.setHours(getHours(date.value), getMinutes(date.value), 0)
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

const onTransactionTemplateSelected = async (transactionTemplate) => {
  if (!transactionTemplate) {
    item.value = new Transaction().getEmpty()
    return
  }
  type.value = transactionTemplate.type
  // We have a watch on type that swaps source/destination accounts for type Income. We don't want anything reversed when using templates
  // Maybe in the future remove the nextTick below rework the logic inside the watch...
  await nextTick()
  amount.value = transactionTemplate.amount
  if (transactionTemplate.account_source_id) {
    accountSource.value = dataStore.accountDictionary[transactionTemplate.account_source_id]
  }

  if (transactionTemplate.account_destination_id) {
    accountDestination.value = dataStore.accountDictionary[transactionTemplate.account_destination_id]
  }
  description.value = transactionTemplate.description
  category.value = transactionTemplate.category
  notes.value = transactionTemplate.notes
  tags.value = transactionTemplate.tags
  budget.value = transactionTemplate.budget
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
  const sortedTagNames = sortByPath(newValue, 'level', false).map((tag) => Tag.getDisplayNameEllipsized(tag))

  if (profileStore.copyTagToDescription && isStringEmpty(description.value)) {
    // The first one is the one with the highest level
    let descriptionValue = head(sortedTagNames) ?? ''
    description.value = profileStore.lowerCaseTransactionDescription ? descriptionValue.toLowerCase() : descriptionValue
  }

  if (profileStore.copyTagToCategory && !category.value) {
    for (let tagName of sortedTagNames) {
      let foundCategory = dataStore.categoryList.find((category) => tagName.toLowerCase() === Category.getDisplayName(category).toLowerCase())
      if (foundCategory) {
        category.value = foundCategory
        break
      }
    }
  }
})

const resetFormFields = () => {
  item.value = new Transaction().getEmpty()
}

const onAssistant = async ({ tag: newTag, category: newCategory, transactionTemplate: transactionTemplate, amount: newAmount, description: newDescription, isTodo: newIsTodo, assistantCurrency }) => {
  resetFormFields()

  newTag && (tags.value = Tag.getTagWithParents(newTag))
  newIsTodo && dataStore.tagTodo && (tags.value = [...tags.value, dataStore.tagTodo])
  newCategory && (category.value = newCategory)
  transactionTemplate ? await onTransactionTemplateSelected(transactionTemplate) : (type.value = Transaction.types.expense)

  if (newAmount && newAmount > 0) {
    if (!assistantCurrency || !accountSource.value || Account.getCurrencyCode(accountSource.value) === Currency.getCode(assistantCurrency)) {
      amount.value = newAmount
    } else {
      amountForeign.value = newAmount
      currencyForeign.value = assistantCurrency
      // Attempt to compute "amount" via exchange rate
      if (accountSource.value) {
        let sourceAccountDecimalPlaces = Account.getCurrencyDecimalPlaces(accountSource.value)
        amount.value = convertCurrency(amountForeign.value, Currency.getCode(currencyForeign.value), Account.getCurrencyCode(accountSource.value)).toFixed(sourceAccountDecimalPlaces)
      }
    }
  }

  newDescription && (description.value = newDescription)
}

const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

const getStyleForField = (fieldType) => {
  let fieldCode = fieldType.code
  let position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
  let field = profileStore.transactionFormFieldsConfig.find((item) => item.code === fieldCode)
  let isVisible = field ? field.isVisible : true
  let displayStyle = isVisible ? '' : 'display: none'

  if (isTypeExpense.value) {
    return `order: ${position}; ${displayStyle}`
  }

  // Should be same as income, but reverse the position on source with destination
  if (isTypeIncome.value) {
    let position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
    if (fieldCode === transactionFormField.sourceAccount.code) {
      position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === transactionFormField.destinationAccount.code)
    }
    if (fieldCode === transactionFormField.destinationAccount.code) {
      position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === transactionFormField.sourceAccount.code)
    }
    return `order: ${position}; ${displayStyle}`
  }

  // Transfers
  if (isTypeTransfer.value) {
    if ([transactionFormField.sourceAccount.code, transactionFormField.destinationAccount.code].includes(fieldCode)) {
      return `order: 0`
    }
    let position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
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
  newValue = newValue ?? ''
  if (profileStore.lowerCaseTransactionDescription) {
    newValue = newValue.toLowerCase()
  }
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  description.value = newValue
})

const showSourceAccountSuggestion = computed(() => !profileStore.defaultAccountSource && !accountSource.value)

const isCloning = computed(() => !!get(route.query, 'transaction_id'))

const { t } = useI18n()
const title = computed(() => {
  return isCloning.value ? t('transaction.title_clone_transaction') : itemId.value ? t('transaction.title_edit_transaction') : t('transaction.title_add_transaction')
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
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

  delete cloneItem.id
  item.value = cloneItem
}
</script>
