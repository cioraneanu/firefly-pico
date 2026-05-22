import { computed } from 'vue'
import { uniq } from 'lodash-es'
import { uniqBy } from 'lodash-es/array.js'
import Account from '~/models/Account'
import Transaction from '~/models/Transaction'
import Currency from '~/models/Currency.js'
import { convertCurrency, convertTransactionAmountToCurrency, convertTransactionsTotalAmountToCurrency } from '~/utils/CurrencyUtils'
import DateUtils from '~/utils/DateUtils.js'
import { useAccountStore } from '~/stores/useAccountStore'
import { useDashboardStore } from '~/stores/useDashboardStore'
import { useProfileStore } from '~/stores/profileStore'
import { useCurrencyStore } from '~/stores/useCurrencyStore'
import { useBudgetStore } from '~/stores/useBudgetStore'

export const useDashboardStats = () => {
  const accountStore = useAccountStore()
  const dashboardStore = useDashboardStore()
  const profileStore = useProfileStore()
  const currencyStore = useCurrencyStore()
  const budgetStore = useBudgetStore()

  const dashboardAccounts = computed(() => {
    return accountStore.accountList.filter((account) => {
      const isTypeAssetOrLiability = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode].includes(Account.getType(account)?.fireflyCode)
      return isTypeAssetOrLiability && Account.getIsActive(account) && (Account.getBalance(account) != 0 || profileStore.dashboard.areEmptyAccountsVisible)
    })
  })

  const dashboardAccountsVisible = computed(() => dashboardAccounts.value.filter((item) => Account.getIsVisibleOnDashboard(item)))
  
  const dashboardAccountsInNetWorth = computed(() => dashboardAccounts.value.filter((item) => Account.getIsIncludedInNetWorth(item)))

  const dashboardAccountsCurrencyList = computed(() => uniq(dashboardAccountsInNetWorth.value.map((account) => account?.attributes?.currency)))

  const dashboardAccountsGroupsList = computed(() => uniq(dashboardAccountsInNetWorth.value.map((account) => account?.attributes?.group)).filter((item) => !!item))

  const dashboardAccountsTotalByCurrency = computed(() => {
    return dashboardAccountsInNetWorth.value.reduce((result, account) => {
      let accountCurrency = account?.attributes?.currency_code
      const accountBalance = parseFloat(account?.attributes?.current_balance ?? 0)
      let oldValue = result[accountCurrency] ?? 0
      result[accountCurrency] = oldValue + accountBalance
      return result
    }, {})
  })

  const dashboardAccountsEstimatedTotal = computed(() => {
    if (!currencyStore.dashboardCurrency) return ' - '

    return Object.keys(dashboardAccountsTotalByCurrency.value)
      .reduce((result, currencyCode) => {
        const currencyAmount = dashboardAccountsTotalByCurrency.value[currencyCode]
        return result + convertCurrency(currencyAmount, currencyCode, Currency.getCode(currencyStore.dashboardCurrency))
      }, 0)
      .toFixed(2)
  })

  const dashboardAccountsTotalByGroup = computed(() => {
    return dashboardAccountsInNetWorth.value.reduce((result, account) => {
      let group = account?.attributes?.group
      if (!group) return result
      let accountBalance = parseFloat(account?.attributes?.current_balance ?? 0)
      accountBalance = convertCurrency(accountBalance, Account.getCurrencyCode(account), Currency.getCode(currencyStore.dashboardCurrency))

      let oldValue = result[group] ?? 0
      result[group] = oldValue + accountBalance
      return result
    }, {})
  })

  const transactionsListExpense = computed(() => {
    return dashboardStore.transactionsList.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.expense.code)
  })

  const transactionsListIncome = computed(() => {
    return dashboardStore.transactionsList.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.income.code)
  })

  const transactionsListTransfers = computed(() => {
    return dashboardStore.transactionsList.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.transfer.code)
  })

  const dashboardExpensesByCategory = computed(() => {
    return transactionsListExpense.value.reduce((result, transaction) => {
      const splits = Transaction.getSplits(transaction)
      for (let split of splits) {
        const categoryId = split.category_id
        const oldTotal = result[categoryId] ?? 0
        result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(currencyStore.dashboardCurrency))
      }
      return result
    }, {})
  })

  const dashboardExpensesByTag = computed(() => {
    return transactionsListExpense.value.reduce((result, transaction) => {
      let tags = Transaction.getTags(transaction)
      let rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      let targetTags = dashboardStore.tagsWidgetModeOnlyRootTag ? [rootTag] : tags
      for (let targetTag of targetTags) {
        let tagId = targetTag?.id ?? 0
        let oldTotal = result[tagId] ?? 0
        result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(currencyStore.dashboardCurrency))
      }
      return result
    }, {})
  })

  const dashboardTransfersByCategory = computed(() => {
    return transactionsListTransfers.value.reduce((result, transaction) => {
      const splits = Transaction.getSplits(transaction)
      for (let split of splits) {
        const categoryId = split.category_id
        const oldTotal = result[categoryId] ?? 0
        result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(currencyStore.dashboardCurrency))
      }
      return result
    }, {})
  })

  const dashboardTransfersByTag = computed(() => {
    return transactionsListTransfers.value.reduce((result, transaction) => {
      let tags = Transaction.getTags(transaction)
      let rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      let targetTags = dashboardStore.tagsWidgetModeOnlyRootTag ? [rootTag] : tags
      for (let targetTag of targetTags) {
        let tagId = targetTag?.id ?? 0
        let oldTotal = result[tagId] ?? 0
        result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(currencyStore.dashboardCurrency))
      }
      return result
    }, {})
  })

  const transactionsLatest = computed(() => dashboardStore.transactionsList.slice(0, 3))

  const dashboardCalendarTransactionsByDate = computed(() => {
    return dashboardStore.transactionsList.reduce((result, transaction) => {
      const date = DateUtils.dateToString(Transaction.getDate(transaction))
      if (!(date in result)) {
        result[date] = {
          [Transaction.types.expense.code]: 0,
          [Transaction.types.income.code]: 0,
          [Transaction.types.transfer.code]: 0,
        }
      }

      let transactionTypeCode = Transaction.getTypeCode(transaction)
      let amount = convertTransactionAmountToCurrency(transaction, Currency.getCode(currencyStore.dashboardCurrency))
      result[date][transactionTypeCode] += amount
      return result
    }, {})
  })

  const dashboardExpenseByDay = computed(() => {
    return dashboardStore.transactionsListLastWeek.reduce((result, transaction) => {
      const date = DateUtils.dateToString(Transaction.getDate(transaction))
      const oldValue = result[date] ?? 0
      result[date] = oldValue + convertTransactionAmountToCurrency(transaction, Currency.getCode(currencyStore.dashboardCurrency))
      return result
    }, {})
  })

  const transactionsListSavingsIn = computed(() => {
    return dashboardStore.transactionsList.filter((item) => {
      let accountDestinationRoleCode = item?.attributes?.transactions?.[0]?.accountDestination?.attributes?.account_role?.fireflyCode
      return accountDestinationRoleCode === Account.roleAssets.saving.fireflyCode
    })
  })

  const transactionsListSavingsOut = computed(() => {
    return dashboardStore.transactionsList.filter((item) => {
      let accountSourceRoleCode = item?.attributes?.transactions?.[0]?.accountSource?.attributes?.account_role?.fireflyCode
      return accountSourceRoleCode === Account.roleAssets.saving.fireflyCode
    })
  })

  const transactionsListSavings = computed(() => uniqBy([...transactionsListSavingsIn.value, ...transactionsListSavingsOut.value], 'id'))
  const transactionsListSavingsCount = computed(() => transactionsListSavings.value.length)
  
  const transactionsListSavingsAmount = computed(() => {
    let amountIn = convertTransactionsTotalAmountToCurrency(transactionsListSavingsIn.value, Currency.getCode(currencyStore.dashboardCurrency))
    let amountOut = convertTransactionsTotalAmountToCurrency(transactionsListSavingsOut.value, Currency.getCode(currencyStore.dashboardCurrency))
    return amountIn - amountOut
  })

  const totalExpenseThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListExpense.value, Currency.getCode(currencyStore.dashboardCurrency)))
  const totalIncomeThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListIncome.value, Currency.getCode(currencyStore.dashboardCurrency)))
  const totalTransfersThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListTransfers.value, Currency.getCode(currencyStore.dashboardCurrency)))
  const totalSurplusThisMonth = computed(() => totalIncomeThisMonth.value - totalExpenseThisMonth.value)
  const totalTransactionsCount = computed(() => dashboardStore.transactionsList.length ?? 0)

  const transactionsListSavingsPercentage = computed(() => {
    if (totalIncomeThisMonth.value === 0) return 0
    let percent = ((transactionsListSavingsAmount.value * 1.0) / totalIncomeThisMonth.value) * 100
    return Math.max(percent, 0)
  })

  const budgetLimitTotal = computed(() => {
    return budgetStore.budgetLimitList.reduce((result, budgetLimit) => {
      let budgetAmount = budgetLimit?.attributes?.amount ?? 0
      let budgetCurrencyCode = budgetLimit?.attributes?.currency_code
      return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(currencyStore.dashboardCurrency))
    }, 0)
  })

  const budgetLimitSpent = computed(() => {
    return Math.abs(
      budgetStore.budgetLimitList.reduce((result, budgetLimit) => {
        let budgetAmount = budgetLimit?.attributes?.spent ?? 0
        let budgetCurrencyCode = budgetLimit?.attributes?.currency_code
        return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(currencyStore.dashboardCurrency))
      }, 0),
    )
  })

  const budgetLimitRemaining = computed(() => budgetLimitTotal.value - budgetLimitSpent.value)

  return {
    dashboardAccounts,
    dashboardAccountsVisible,
    dashboardAccountsInNetWorth,
    dashboardAccountsCurrencyList,
    dashboardAccountsGroupsList,
    dashboardAccountsTotalByCurrency,
    dashboardAccountsEstimatedTotal,
    dashboardAccountsTotalByGroup,
    transactionsListExpense,
    transactionsListIncome,
    transactionsListTransfers,
    dashboardExpensesByCategory,
    dashboardExpensesByTag,
    dashboardTransfersByCategory,
    dashboardTransfersByTag,
    transactionsLatest,
    dashboardCalendarTransactionsByDate,
    dashboardExpenseByDay,
    transactionsListSavingsIn,
    transactionsListSavingsOut,
    transactionsListSavings,
    transactionsListSavingsCount,
    transactionsListSavingsAmount,
    transactionsListSavingsPercentage,
    totalExpenseThisMonth,
    totalIncomeThisMonth,
    totalTransfersThisMonth,
    totalSurplusThisMonth,
    totalTransactionsCount,
    budgetLimitTotal,
    budgetLimitSpent,
    budgetLimitRemaining
  }
}
