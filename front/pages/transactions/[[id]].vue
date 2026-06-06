<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <div class="mb-10" />

    <transaction-assistant v-if="!itemId && !isCloning" v-model="assistantText" @change="onAssistant" @keyup.enter="saveItem" />

    <transaction-type-tabs v-model="type" class="mx-3 mt-1 mb-1" />

    <van-form ref="form" :disabled="isSplitTransaction" :name="formName" class="transaction-form-group" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset class="dynamic-masonry display-flex-column">
        <div v-if="isSplitTransaction" class="display-flex ml-3 mt-3">
          <transaction-split-badge />
        </div>

        <transaction-amount-field
          v-model:amount="amount"
          v-model:amount-foreign="amountForeign"
          v-model:currency-foreign="currencyForeign"
          :currency="sourceCurrency"
          :is-foreign-amount-visible="isForeignAmountVisible"
          name="amount"
          :style="getStyleForField(transactionFormField.amount)"
          :disabled="isSplitTransaction"
          :is-amount-required="true"
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
              <van-button v-if="showSourceAccountSuggestion" size="mini" class="suggestion-button cursor-pointer" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)"
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
            <van-button size="small" class="cursor-pointer" @click="onSubDay">{{ $t('sub_day') }}</van-button>
            <van-button size="small" class="cursor-pointer" @click="onToday">{{ $t('today') }}</van-button>
            <van-button size="small" class="cursor-pointer" @click="onAddDay">{{ $t('add_day') }}</van-button>
          </div>
        </div>

        <transaction-note-field v-model="notes" :style="getStyleForField(transactionFormField.notes)" />

        <budget-select v-model="budget" :style="getStyleForField(transactionFormField.budget)" />

        <transaction-attachments-list :transaction="item" :style="getStyleForField(transactionFormField.attachments)" />
      </van-cell-group>

      <div style="margin: 16px; position: relative">
        <app-button-form-delete v-if="itemId && !isSplitTransaction" class="mt-10" @click="onDelete" />

        <div class="display-flex gap-1">
          <van-button v-if="itemId && !isSplitTransaction" block type="default" class="mt-2 flex-1 cursor-pointer" @click="onCreateClone">
            <app-icon :icon="TablerIconConstants.clone" />
            {{ $t('clone') }}
          </van-button>

          <van-button v-if="itemId && !isSplitTransaction" block type="default" class="mt-2 flex-1 cursor-pointer" @click="onCreateTransactionTemplate">
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

import _, { get, head, isEqual } from 'lodash-es'
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
import { useTransactionFormLogic } from '~/composables/useTransactionFormLogic.js'


const profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)
const assistantText = ref('')

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
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
  const newTransactionWithDefaultCurrency = !itemId.value && (profileStore.defaultForeignCurrency || profileStore.isForeignCurrencyAlwaysVisible)
  const areTypeAssetsWithDifferentCurrencies =
    accountSource.value &&
    accountDestination.value &&
    Account.getType(accountSource.value)?.fireflyCode === Account.types.asset.fireflyCode &&
    Account.getType(accountDestination.value)?.fireflyCode === Account.types.asset.fireflyCode &&
    Account.getCurrency(accountSource.value)?.id !== Account.getCurrency(accountDestination.value)?.id
  return !!(newTransactionWithDefaultCurrency || areTypeAssetsWithDifferentCurrencies || currencyForeign.value || amountForeign.value)
})

//

// ----- Custom logic -----

const { onAssistant, attemptAccountsFix } = useTransactionFormLogic({
  item,
  itemId,
  category,
  tags,
  description,
  type,
  accountSource,
  accountDestination,
  amount,
  amountForeign,
  currencyForeign,
  notes,
  budget,
  profileStore
})

const onSubDay = () => {
  date.value = addDays(date.value, -1)
}

const onToday = () => {
  const newDate = startOfToday()
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



const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

const getStyleForField = (fieldType) => {
  const fieldCode = fieldType.code
  const position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
  const field = profileStore.transactionFormFieldsConfig.find((item) => item.code === fieldCode)
  const isVisible = field ? field.isVisible : true
  const displayStyle = isVisible ? '' : 'display: none'

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
    const position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
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
  // Only react to real user-driven tab switches on the new-transaction form.
  // On initial form population, oldValue is undefined and the saved defaults
  // are still being settled — running the repair there silently dropped them.
  if (itemId.value || !oldValue || isEqual(newValue, oldValue)) {
    return
  }
  attemptAccountsFix()
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
