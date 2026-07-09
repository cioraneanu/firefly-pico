import { computed } from 'vue'
import { uniqBy } from 'lodash-es'
import Tag from '~/models/Tag'
import Category from '~/models/Category.js'
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Currency from '~/models/Currency.js'
import TransactionTemplate from '~/models/TransactionTemplate.js'
import Transaction from '~/models/Transaction.js'
import LanguageUtils from '~/utils/LanguageUtils.js'

export const useRambleTransactionResolver = () => {
  const profileStore = useProfileStore()
  const tagStore = useTagStore()
  const categoryStore = useCategoryStore()
  const templateStore = useTemplateStore()
  const budgetStore = useBudgetStore()
  const accountStore = useAccountStore()
  const currencyStore = useCurrencyStore()

  const normalizeName = (value) => LanguageUtils.removeAccentsAndLowerCase(value).trim()

  // Normalizing names (accent stripping + lowercasing) is the hot part of resolving, so each
  // store list is indexed once and only re-indexed when the list itself changes.
  const buildNormalizedIndex = (list, getNames) =>
    list.map((item) => {
      const names = getNames(item).filter(Boolean)
      return {
        item,
        names,
        normalizedNames: names.map(normalizeName).filter(Boolean),
      }
    })

  const getTagNames = (tag) => [Tag.getDisplayName(tag)]
  const getCategoryNames = (category) => [Category.getDisplayName(category)]
  const getTemplateNames = (template) => TransactionTemplate.getAllNames(template)
  const getBudgetNames = (budget) => [Budget.getDisplayName(budget)]
  const getAccountNames = (account) => [Account.getDisplayName(account)]
  const getCurrencyNames = (currency) => [Currency.getCode(currency), Currency.getName(currency), Currency.getSymbol(currency)]

  const tagIndex = computed(() => buildNormalizedIndex(tagStore.tagList, getTagNames))
  const categoryIndex = computed(() => buildNormalizedIndex(categoryStore.categoryList, getCategoryNames))
  const templateIndex = computed(() => buildNormalizedIndex(templateStore.transactionTemplateList, getTemplateNames))
  const budgetIndex = computed(() => buildNormalizedIndex(budgetStore.budgetList, getBudgetNames))
  const accountIndex = computed(() => buildNormalizedIndex(accountStore.accountList, getAccountNames))
  const currencyIndex = computed(() => buildNormalizedIndex(currencyStore.currenciesList, getCurrencyNames))

  const resolveByName = (index, name) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      return null
    }

    const exactMatch = index.find((entry) => entry.normalizedNames.some((itemName) => itemName === normalizedName))
    if (exactMatch) {
      return exactMatch.item
    }

    const partialMatch = index.find((entry) => entry.normalizedNames.some((itemName) => itemName.length >= 3 && (itemName.includes(normalizedName) || normalizedName.includes(itemName))))
    return partialMatch?.item ?? null
  }

  const resolveTags = (tagNames = []) => {
    return uniqBy(tagNames.map((tagName) => resolveByName(tagIndex.value, tagName)).filter(Boolean), 'id')
  }

  const resolveCategory = (categoryName) => {
    return resolveByName(categoryIndex.value, categoryName)
  }

  const resolveTemplate = (templateName) => {
    return resolveByName(templateIndex.value, templateName)
  }

  const resolveBudget = (budgetName) => {
    return resolveByName(budgetIndex.value, budgetName)
  }

  const resolveAccount = (accountName) => {
    return resolveByName(accountIndex.value, accountName)
  }

  const resolveCurrency = (currencyCode) => {
    return resolveByName(currencyIndex.value, currencyCode)
  }

  const resolveDate = (date) => {
    if (!date) {
      return null
    }

    const result = new Date(date)
    return Number.isNaN(result.getTime()) ? null : result
  }

  const resolveTransactionType = (type) => {
    return Transaction.typesList.find((transactionType) => transactionType.code === type) ?? null
  }

  const contextNames = (index) => {
    return index
      .map((entry) => entry.names)
      .flat()
      .slice(0, 200)
  }

  const rambleContext = computed(() => ({
    tags: contextNames(tagIndex.value),
    categories: contextNames(categoryIndex.value),
    templates: contextNames(templateIndex.value),
    budgets: contextNames(budgetIndex.value),
    accounts: contextNames(accountIndex.value),
    currencies: contextNames(currencyIndex.value),
  }))

  const getRambleContext = () => rambleContext.value

  const resolveAssistantAccount = (accountName) => {
    return accountName ? (resolveAccount(accountName) ?? undefined) : undefined
  }

  const resolveRambleTransaction = (rawTransaction, index) => {
    const template = resolveTemplate(rawTransaction.templateName)
    const tags = resolveTags(rawTransaction.tagNames)
    const category = resolveCategory(rawTransaction.categoryName)
    const budget = resolveBudget(rawTransaction.budgetName)
    const type = resolveTransactionType(rawTransaction.type)
    const fixedAccounts = Transaction.attemptAccountFixOnTypeChange(
      type ?? Transaction.types.expense,
      resolveAssistantAccount(rawTransaction.sourceAccountName) ?? profileStore.defaultAccountSource,
      resolveAssistantAccount(rawTransaction.destinationAccountName) ?? profileStore.defaultAccountDestination,
    )
    const assistantCurrency = resolveCurrency(rawTransaction.currencyCode)
    const rawDescription = rawTransaction.description || rawTransaction.templateName || rawTransaction.categoryName || rawTransaction.tagNames?.[0] || 'Transaction'

    return {
      id: `${Date.now()}-${index}`,
      raw: rawTransaction,
      transactionTemplate: template,
      tags,
      category,
      budget,
      accountSource: fixedAccounts.source,
      accountDestination: fixedAccounts.destination,
      type,
      amount: rawTransaction.amount === null || rawTransaction.amount === undefined ? null : rawTransaction.amount.toString(),
      assistantCurrency,
      currencyCode: rawTransaction.currencyCode,
      description: rawDescription,
      notes: rawTransaction.notes,
      date: resolveDate(rawTransaction.occurredAt),
    }
  }

  return {
    getRambleContext,
    resolveRambleTransaction,
  }
}
