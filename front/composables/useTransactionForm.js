import { get, head, isEqual, uniqBy } from 'lodash-es'
import { addDays } from 'date-fns'
import Account from '~/models/Account'
import Category from '~/models/Category'
import Tag from '~/models/Tag'
import Currency from '~/models/Currency.js'
import Transaction from '~/models/Transaction'
import { transactionFormField } from '~/constants/TransactionConstants.js'
import { generateChildren } from '~/utils/VueUtils'
import { isStringEmpty } from '~/utils/DataUtils'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'

const transactionPathKey = 'attributes.transactions.0'

export const useTransactionForm = ({ item, itemId, profileStore = useProfileStore() }) => {
  const accountStore = useAccountStore()
  const categoryStore = useCategoryStore()
  const tagStore = useTagStore()

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

  const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
  const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
  const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

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

  const attemptAccountsFix = () => {
    let { source, destination } = Transaction.attemptAccountFixOnTypeChange(type.value, accountSource.value, accountDestination.value)
    accountSource.value = source
    accountDestination.value = destination
  }

  const onTransactionTemplateSelected = async (transactionTemplate) => {
    if (!transactionTemplate) {
      resetItemInPlace()
      return
    }
    type.value = transactionTemplate.type

    amount.value = transactionTemplate.amount
    if (transactionTemplate.account_source_id) {
      accountSource.value = accountStore.accountDictionary[transactionTemplate.account_source_id]
    }

    if (transactionTemplate.account_destination_id) {
      accountDestination.value = accountStore.accountDictionary[transactionTemplate.account_destination_id]
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
        let foundCategory = categoryStore.categoryList.find((c) => tagName.toLowerCase() === Category.getDisplayName(c).toLowerCase())
        if (foundCategory) {
          category.value = foundCategory
          break
        }
      }
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

  const resetItemInPlace = () => {
    const emptyItem = new Transaction().getEmpty()
    if (!item.value) {
      item.value = emptyItem
      return
    }

    // When `item` is a defineModel bound to a parent v-model, assigning a new object
    // only emits upward and keeps returning the old object until the parent re-renders.
    // Every field set that follows would then land on the stale object and be lost,
    // so the reset must mutate the current object instead of replacing it.
    Object.keys(item.value).forEach((key) => delete item.value[key])
    Object.assign(item.value, emptyItem)
  }

  const appendTags = (newTags = []) => {
    const tagsWithParents = newTags
      .filter(Boolean)
      .map((tag) => Tag.getTagWithParents(tag))
      .flat()
    tags.value = uniqBy([...(tags.value ?? []), ...tagsWithParents], 'id')
  }

  const applyAssistantTransaction = async ({
    tag: newTag,
    tags: newTags,
    category: newCategory,
    transactionTemplate: transactionTemplate,
    amount: newAmount,
    description: newDescription,
    notes: newNotes,
    budget: newBudget,
    isTodo: newIsTodo,
    dateOffset: newDateOffset,
    date: newDate,
    assistantCurrency,
    accountSource: newAccountSource,
    accountDestination: newAccountDestination,
    type: newType,
  }) => {
    resetItemInPlace()

    transactionTemplate ? await onTransactionTemplateSelected(transactionTemplate) : (type.value = newType ?? Transaction.types.expense)

    if (newAccountSource !== undefined) {
      accountSource.value = newAccountSource
    }
    if (newAccountDestination !== undefined) {
      accountDestination.value = newAccountDestination
    }
    if (!newType && (newAccountSource || newAccountDestination)) {
      type.value = Transaction.getTransactionTypeForAccounts({ source: accountSource.value, destination: accountDestination.value })
    }

    appendTags([newTag, ...(newTags ?? [])])
    newIsTodo && tagStore.tagTodo && appendTags([tagStore.tagTodo])
    newCategory && (category.value = newCategory)
    newNotes && (notes.value = newNotes)
    newBudget && (budget.value = newBudget)

    if (newAmount && newAmount > 0) {
      const accountCurrencyCode = Account.getCurrencyCode(accountSource.value)
      const assistantCurrencyCode = Currency.getCode(assistantCurrency)
      const isForeignAmount = assistantCurrencyCode && accountCurrencyCode && accountCurrencyCode !== assistantCurrencyCode
      // Attempt to compute "amount" via exchange rate. Falls back to the raw amount when the
      // account currency or exchange rates are unknown, since converting would yield NaN.
      const convertedAmount = isForeignAmount ? convertCurrency(newAmount, assistantCurrencyCode, accountCurrencyCode) : NaN
      if (Number.isFinite(convertedAmount)) {
        amountForeign.value = newAmount
        currencyForeign.value = assistantCurrency
        amount.value = convertedAmount.toFixed(Account.getCurrencyDecimalPlaces(accountSource.value) ?? 2)
      } else {
        amount.value = newAmount
      }
    }

    newDescription && (description.value = newDescription)
    if (date && newDate) {
      date.value = newDate
    } else if (date && (newDateOffset || newDateOffset === 0)) {
      date.value = addDays(new Date(), newDateOffset)
    }
    attemptAccountsFix()
  }

  const onSubDay = () => {
    date.value = addDays(date.value, -1)
  }

  const onToday = () => {
    date.value = new Date()
  }

  const onAddDay = () => {
    date.value = addDays(date.value, 1)
  }

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
    isSplitTransaction,
    accountSourceAllowedTypes,
    accountDestinationAllowedTypes,
    sourceCurrency,
    isForeignAmountVisible,
    applyAssistantTransaction,
    onSubDay,
    onToday,
    onAddDay,
    isTypeTransfer,
    getStyleForField,
    accountSourceBinding,
    accountDestinationBinding,
    showSourceAccountSuggestion,
  }
}
