<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <!--                <van-button-->
        <!--                    v-if="!itemId"-->
        <!--                    @click="showTransactionVoice = true"-->
        <!--                    size="small"-->
        <!--                    class="mr-10 no-border">-->
        <!--                  <template #icon>-->
        <!--                    <van-icon name="audio" size="18"/>-->
        <!--                  </template>-->
        <!--                </van-button>-->

        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-10" />

    <transaction-assistant v-if="!itemId" @change="onAssistant" />

    <transaction-type-tabs v-model="type" class="mx-3 mt-1 mb-1" />

    <van-form class="transaction-form-group" ref="form" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset class="mt-0 flex-column display-flex">
        <template #title v-if="isSplitPayment">
          <div>
            <van-tag class="ml-5" type="warning">Split payment</van-tag>
          </div>
        </template>

        Keyboard = {{ isKeyboardVisible }}, Height = {{ keyboardHeight }}

        <transaction-amount-field
          required
          v-model="amount"
          v-model:foreign="amountForeign"
          :currency="sourceCurrencyCode"
          :currencyForeign="destinationCurrencyCode"
          :isForeignAmountVisible="isForeignAmountVisible"
          ref="refAmount"
          :rules="[{ required: true, message: 'Amount is required' }]"
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_AMOUNT)"
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
              <van-button v-if="showSourceAccountSuggestion" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_NEW_TRANSACTION_DEFAULTS)" size="mini" class="suggestion-button"
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
          type="textarea"
          rows="1"
          autosize
          :icon="TablerIconConstants.blockQuote"
          placeholder="Description"
          :rules="[{ required: true, message: 'Description is required' }]"
          required
          :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DESCRIPTION)"
        />

        <tag-select v-model="tags" :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_TAG)" />

        <div :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_DATE)">
          <app-date-time-grid v-model="date" :rules="[{ required: true, message: 'Date is required' }]" required />

          <div class="px-3 flex-center-vertical gap-1">
            <van-button size="small" @click="onSubDay">-1 day</van-button>
            <van-button size="small" @click="onToday">Today</van-button>
            <van-button size="small" @click="onAddDay">+1 day</van-button>
          </div>
        </div>

        <app-field v-model="notes" label="Notes" placeholder="No notes..." type="textarea" rows="1" autosize :style="getStyleForField(FORM_CONSTANTS_TRANSACTION_FIELDS.TRANSACTION_FORM_FIELD_NOTES)">
          <template #left-icon>
            <app-icon :icon="TablerIconConstants.textInput" :size="20" />
          </template>
        </app-field>
      </van-cell-group>

      <div style="margin: 16px; position: relative">
        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />

        <van-button v-if="itemId && !isSplitPayment" @click="onCreateTransactionTemplate" block type="default" class="mt-2">
          <app-icon :icon="TablerIconConstants.transactionTemplate" />
          Make template
        </van-button>
      </div>

      <app-button-form-save />
    </van-form>
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

const refAmount = ref(null)
const { isKeyboardVisible, keyboardHeight } = useKeyboard()

// ------------------------------------

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)
const showTransactionVoice = ref(false)
// const selectedTransactionTemplate = ref(null)

let { itemId, item, isEmpty, title, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError } = useForm({
  form: form,
  titleAdd: 'Add transaction',
  titleEdit: 'Edit transaction',
  routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
  model: new Transaction(),
})

const time = ref(['12', '00'])

const pathKey = 'attributes.transactions.0'
const { amount, amountForeign, date, tags, description, notes, accountSource, accountDestination, category, type } = generateChildren(item, [
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
])

const transactions = computed(() => _.get(item.value, 'attributes.transactions', []))
const firstTransaction = computed(() => _.head(transactions.value))
const isSplitPayment = computed(() => transactions.value.length > 1)
const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))
// const accountSourceAllowedTypes = computed(() => [])
// const accountDestinationAllowedTypes = computed(() => [])

// ------------------------------------

const sourceCurrencyCode = computed(() => get(accountSource.value, 'attributes.currency_symbol', ''))
const destinationCurrencyCode = computed(() => get(accountDestination.value, 'attributes.currency_symbol', ''))
const isForeignAmountVisible = computed(() => {
  return accountSource.value && accountDestination.value && sourceCurrencyCode.value !== destinationCurrencyCode.value
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
  // dataStore.transactionToCopy = firstTransaction.value
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}?transaction_id=${itemId.value}`)
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
    description.value = head(sortedTagNames)
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

const onAssistant = async ({ tag: newTag, category: newCategory, transactionTemplate: transactionTemplate, amount: newAmount, description: newDescription }) => {
  tags.value = []
  category.value = null
  description.value = ''

  if (newTag) {
    tags.value = Tag.getTagWithParents(newTag)
    // tags.value = [newTag]
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
  if (isTypeExpense.value) {
    let position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === fieldCode)
    return `order: ${position}`
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
    return `order: ${position}`
  }

  // Transfers
  if (isTypeTransfer.value) {
    if (fieldTypeAccountsList.includes(fieldCode)) {
      return `order: 0`
    }
    let position = profileStore.transactionOrderedFieldsList.findIndex((item) => item.code === fieldCode)
    return `order: ${position}`
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
})
</script>

<style></style>
