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

  const resolveByName = (list, getNames, name) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      return null
    }

    const getNormalizedNames = (item) => getNames(item).filter(Boolean).map(normalizeName)
    const exactMatch = list.find((item) => getNormalizedNames(item).some((itemName) => itemName === normalizedName))
    if (exactMatch) {
      return exactMatch
    }

    return list.find((item) => getNormalizedNames(item).some((itemName) => itemName.length >= 3 && (itemName.includes(normalizedName) || normalizedName.includes(itemName))))
  }

  const uniqueById = (list) => {
    const result = []
    for (const item of list.filter(Boolean)) {
      if (!result.some((existing) => existing.id === item.id)) {
        result.push(item)
      }
    }
    return result
  }

  const resolveTags = (tagNames = []) => {
    return uniqueById(tagNames.map((tagName) => resolveByName(tagStore.tagList, (tag) => [Tag.getDisplayName(tag)], tagName)))
  }

  const resolveCategory = (categoryName) => {
    return resolveByName(categoryStore.categoryList, (category) => [Category.getDisplayName(category)], categoryName)
  }

  const resolveTemplate = (templateName) => {
    return resolveByName(templateStore.transactionTemplateList, (template) => TransactionTemplate.getAllNames(template), templateName)
  }

  const resolveBudget = (budgetName) => {
    return resolveByName(budgetStore.budgetList, (budget) => [Budget.getDisplayName(budget)], budgetName)
  }

  const resolveAccount = (accountName) => {
    return resolveByName(accountStore.accountList, (account) => [Account.getDisplayName(account)], accountName)
  }

  const resolveCurrency = (currencyCode) => {
    return resolveByName(currencyStore.currenciesList, (currency) => [Currency.getCode(currency), Currency.getName(currency), Currency.getSymbol(currency)], currencyCode)
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

  const contextNames = (list, getNames) => {
    return list
      .map((item) => getNames(item))
      .flat()
      .filter(Boolean)
      .slice(0, 200)
  }

  const getRambleContext = () => ({
    tags: contextNames(tagStore.tagList, (tag) => [Tag.getDisplayName(tag)]),
    categories: contextNames(categoryStore.categoryList, (category) => [Category.getDisplayName(category)]),
    templates: contextNames(templateStore.transactionTemplateList, (template) => TransactionTemplate.getAllNames(template)),
    budgets: contextNames(budgetStore.budgetList, (budget) => [Budget.getDisplayName(budget)]),
    accounts: contextNames(accountStore.accountList, (account) => [Account.getDisplayName(account)]),
    currencies: contextNames(currencyStore.currenciesList, (currency) => [Currency.getCode(currency), Currency.getName(currency), Currency.getSymbol(currency)]),
  })

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
    const rawDescription = rawTransaction.description ?? rawTransaction.templateName ?? rawTransaction.categoryName ?? rawTransaction.tagNames?.[0]

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
      description: rawDescription ?? '',
      notes: rawTransaction.notes,
      date: resolveDate(rawTransaction.occurredAt),
    }
  }

  return {
    getRambleContext,
    resolveRambleTransaction,
  }
}
