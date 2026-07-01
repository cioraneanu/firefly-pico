import { get, isEqual } from 'lodash-es'
import { addDays } from 'date-fns'
import Account from '~/models/Account'
import Transaction from '~/models/Transaction'
import { transactionFormField } from '~/constants/TransactionConstants.js'
import { generateChildren } from '~/utils/VueUtils'
import { useTransactionFormLogic } from '~/composables/useTransactionFormLogic.js'

const transactionPathKey = 'attributes.transactions.0'

export const useTransactionFormBindings = ({ item, itemId, profileStore = useProfileStore() }) => {
  const { amount, amountForeign, date, tags, description, notes, budget, piggyBank, accountSource, accountDestination, category, type, currencyForeign } = generateChildren(item, [
    { computed: 'amount', parentKey: `${transactionPathKey}.amount` },
    { computed: 'amountForeign', parentKey: `${transactionPathKey}.amountForeign` },
    { computed: 'currencyForeign', parentKey: `${transactionPathKey}.currencyForeign` },
    { computed: 'date', parentKey: `${transactionPathKey}.date` },
    { computed: 'tags', parentKey: `${transactionPathKey}.tags` },
    { computed: 'description', parentKey: `${transactionPathKey}.description` },
    { computed: 'notes', parentKey: `${transactionPathKey}.notes` },
    { computed: 'accountSource', parentKey: `${transactionPathKey}.accountSource` },
    { computed: 'accountDestination', parentKey: `${transactionPathKey}.accountDestination` },
    { computed: 'category', parentKey: `${transactionPathKey}.category` },
    { computed: 'type', parentKey: `${transactionPathKey}.type` },
    { computed: 'budget', parentKey: `${transactionPathKey}.budget` },
    { computed: 'piggyBank', parentKey: `${transactionPathKey}.piggyBank` },
  ])

  const transactions = computed(() => get(item.value, 'attributes.transactions', []))
  const isSplitTransaction = computed(() => transactions.value.length > 1)
  const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
  const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))
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
    date,
    profileStore,
  })

  const onSubDay = () => {
    date.value = addDays(date.value, -1)
  }

  const onToday = () => {
    date.value = new Date()
  }

  const onAddDay = () => {
    date.value = addDays(date.value, 1)
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

    if (isTypeTransfer.value) {
      if ([transactionFormField.sourceAccount.code, transactionFormField.destinationAccount.code].includes(fieldCode)) {
        return `order: 0`
      }
      const position = profileStore.transactionFormFieldsConfig.findIndex((item) => item.code === fieldCode)
      return `order: ${position}; ${displayStyle}`
    }

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

  const showSourceAccountSuggestion = computed(() => !profileStore.defaultAccountSource && !accountSource.value)

  return {
    amount,
    amountForeign,
    date,
    tags,
    description,
    notes,
    budget,
    piggyBank,
    accountSource,
    accountDestination,
    category,
    type,
    currencyForeign,
    transactions,
    isSplitTransaction,
    accountSourceAllowedTypes,
    accountDestinationAllowedTypes,
    sourceCurrency,
    isForeignAmountVisible,
    applyAssistantTransaction: onAssistant,
    attemptAccountsFix,
    onSubDay,
    onToday,
    onAddDay,
    isTypeExpense,
    isTypeIncome,
    isTypeTransfer,
    getStyleForField,
    accountSourceBinding,
    accountDestinationBinding,
    showSourceAccountSuggestion,
  }
}
