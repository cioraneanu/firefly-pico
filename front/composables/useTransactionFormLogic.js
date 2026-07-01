import { watch } from 'vue'
import { head, isEqual, uniqBy } from 'lodash-es'
import { addDays } from 'date-fns'
import Category from '~/models/Category'
import Tag from '~/models/Tag'
import Transaction from '~/models/Transaction'
import Currency from '~/models/Currency.js'
import Account from '~/models/Account'
import { isStringEmpty } from '~/utils/DataUtils'

import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'

export const useTransactionFormLogic = ({
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
}) => {
  const accountStore = useAccountStore()
  const categoryStore = useCategoryStore()
  const tagStore = useTagStore()
  const attemptAccountsFix = () => {
    let { source, destination } = Transaction.attemptAccountFixOnTypeChange(type.value, accountSource.value, accountDestination.value)
    accountSource.value = source
    accountDestination.value = destination
  }

  const onTransactionTemplateSelected = async (transactionTemplate) => {
    if (!transactionTemplate) {
      item.value = new Transaction().getEmpty()
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

  const resetFormFields = () => {
    item.value = new Transaction().getEmpty()
  }

  const appendTags = (newTags = []) => {
    const tagsWithParents = newTags
      .filter(Boolean)
      .map((tag) => Tag.getTagWithParents(tag))
      .flat()
    tags.value = uniqBy([...(tags.value ?? []), ...tagsWithParents], 'id')
  }

  const onAssistant = async ({
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
    resetFormFields()

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
    if (date && newDate) {
      date.value = newDate
    } else if (date && (newDateOffset || newDateOffset === 0)) {
      date.value = addDays(new Date(), newDateOffset)
    }
    attemptAccountsFix()
  }

  return {
    onAssistant,
    attemptAccountsFix,
  }
}
