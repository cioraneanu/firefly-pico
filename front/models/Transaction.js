import BaseModel from '~/models/BaseModel'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import TransactionRepository from '~/repository/TransactionRepository'
import { useProfileStore } from '~/stores/profileStore'
import Account from '~/models/Account'
import { get, includes, isEqual } from 'lodash'
import Currency from '~/models/Currency.js'
import { formatNumber } from '~/utils/NumberUtils.js'

export default class Transaction extends BaseModel {
  getTransformer() {
    return TransactionTransformer
  }

  getRepository() {
    return new TransactionRepository()
  }

  getEmpty() {
    const profileStore = useProfileStore()
    let type =
      Transaction.getTransactionTypeForAccounts({
        source: profileStore.defaultAccountSource,
        destination: profileStore.defaultAccountDestination,
      }) ?? Transaction.types.expense

    let date = new Date()
    let minute = Math.ceil(date.getMinutes() / 10) * 10
    date.setMinutes(minute)

    return {
      attributes: {
        transactions: [
          {
            amount: '',
            date: date,
            tags: profileStore.defaultTags,
            description: '',
            notes: '',
            accountSource: profileStore.defaultAccountSource,
            accountDestination: profileStore.defaultAccountDestination,
            type: type,
            category: profileStore.defaultCategory,
            currencyForeign: profileStore.defaultForeignCurrency,
          },
        ],
      },
    }
  }

  getFake(id) {
    return {}
  }

  // ------------

  static get types() {
    return {
      expense: {
        t: 'transaction.type.expense',
        code: 'expense',
        fireflyCode: 'withdrawal',
      },
      income: {
        t: 'transaction.type.income',
        code: 'income',
        fireflyCode: 'deposit',
      },
      transfer: {
        t: 'transaction.type.transfer',
        code: 'transfer',
        fireflyCode: 'transfer',
      },
    }
  }

  static get typesList() {
    return Object.values(this.types)
  }

  // -----

  static getTypeCode(transaction) {
    return get(transaction, 'attributes.transactions.0.type.code')
  }

  static getAmount(transaction) {
    let transactionSplits = get(transaction, 'attributes.transactions', [])
    return transactionSplits.reduce((result, item) => {
      let amount = parseFloat(item.amount)
      return result + amount
    }, 0)
  }

  static getCurrency(transaction) {
    return get(transaction, 'attributes.transactions.0.currency', [])
  }

  static getCurrencyCode(transaction) {
    return get(transaction, 'attributes.transactions.0.currency_code', [])
  }

  static getTags(transaction) {
    return get(transaction, 'attributes.transactions', [])
      .map((item) => item.tags)
      .flat()
  }

  static getCategoryId(transaction) {
    return get(transaction, 'attributes.transactions.0.category_id', 0)
  }

  static getSplits(transaction) {
    return get(transaction, 'attributes.transactions', [])
  }

  static getAmountFormatted(transaction) {
    let currency = this.getCurrency(transaction)
    let digits = Currency.getDecimalPlaces(currency)
    return formatNumber(this.getAmount(transaction), digits)
  }

  static getDate(transaction) {
    return get(transaction, 'attributes.transactions.0.date')
  }

  static formatAmountForCurrency(amount, currency) {
    if (!amount || !currency) {
      return null
    }
    let decimals = Currency.getDecimalPlaces(currency) ?? 2
    return parseFloat(amount).toFixed(decimals)
  }

  static getTransactionTypeForAccounts({ source, destination }) {
    if (!source && !destination) {
      return this.types.expense
    }

    let sourceTypeCode = Account.getType(source)?.fireflyCode
    let destinationTypeCode = Account.getType(destination)?.fireflyCode

    let isIncomeViaLoan = sourceTypeCode === Account.types.liability.fireflyCode && destinationTypeCode === Account.types.asset.fireflyCode
    if (!source || sourceTypeCode === Account.types.revenue.fireflyCode || isIncomeViaLoan) {
      return this.types.income
    }

    let isTransferViaLoan = sourceTypeCode === Account.types.liability.fireflyCode && destinationTypeCode === Account.types.liability.fireflyCode
    let isTransferViaAssets = sourceTypeCode === Account.types.asset.fireflyCode && destinationTypeCode === Account.types.asset.fireflyCode
    if (isTransferViaAssets || isTransferViaLoan) {
      return this.types.transfer
    }

    return this.types.expense
  }

  static attemptAccountFixOnTypeChange(newType, sourceAccount, destinationAccount) {
    let firstAsset = [sourceAccount, destinationAccount].find((account) => Account.getType(account)?.fireflyCode === Account.types.asset.fireflyCode)

    switch (newType.code) {
      case Transaction.types.income.code:
        let source = [sourceAccount, destinationAccount].find((account) => [Account.types.liability.fireflyCode, Account.types.revenue.fireflyCode, Account.types.cash.fireflyCode].includes(Account.getType(account)?.fireflyCode))
        return { source: source, destination: firstAsset }

      case Transaction.types.expense.code:
        let destination = [sourceAccount, destinationAccount].find((account) => {
          return [Account.types.liability.fireflyCode, Account.types.expense.fireflyCode, Account.types.cash.fireflyCode].includes(Account.getType(account)?.fireflyCode)
        })
        return { source: firstAsset, destination: destination }
      case Transaction.types.transfer.code:
        let otherAsset = [sourceAccount, destinationAccount].find((account) => firstAsset?.id !== account?.id && Account.getType(account)?.code === Account.types.asset.code)
        return { source: firstAsset, destination: otherAsset }
    }
  }
}
