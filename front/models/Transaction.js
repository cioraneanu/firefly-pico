import BaseModel from '~/models/BaseModel'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import TransactionRepository from '~/repository/TransactionRepository'
import { useProfileStore } from '~/stores/profileStore'
import Account from '~/models/Account'
import _, { get, isEqual } from 'lodash'

class Transaction extends BaseModel {
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
    // let type = Transaction.typesList.find(item => item.code === transactionTypeCode)
    // let type = Transaction.types[transactionTypeCode]

    let date = new Date()
    let minute = Math.ceil(date.getMinutes() / 10) * 10
    date.setMinutes(minute)

    return {
      // data: {
      attributes: {
        transactions: [
          {
            amount: '',
            // 'date': startOfDay(new Date()),
            date: date,
            tags: profileStore.defaultTags,
            description: '',
            notes: '',
            accountSource: profileStore.defaultAccountSource,
            accountDestination: profileStore.defaultAccountDestination,
            type: type,
            category: profileStore.defaultCategory,
            currencyForeign: profileStore.defaultForeignCurrency
          },
        ],
      },
      // },
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
    let transactionSplits = _.get(transaction, 'attributes.transactions', [])
    return transactionSplits.reduce((result, item) => {
      let amount = parseFloat(item.amount)
      return result + amount
    }, 0)
  }

  static getCurrency(transaction) {
    return get(transaction, 'attributes.transactions.0.currency_code', [])
  }

  static getTags(transaction) {
    return get(transaction, 'attributes.transactions', []).map(item => item.tags).flat()
  }

  static getCategoryId(transaction) {
    return get(transaction, 'attributes.transactions.0.category_id', 0)
  }

  static getSplits(transaction) {
    return get(transaction, 'attributes.transactions', [])
  }

  static getAmountFormatted(transaction) {
    return this.getAmount(transaction).toFixed(2)
  }

  static getDate(transaction) {
    return get(transaction, 'attributes.transactions.0.date')
  }

  static formatAmount(amount) {
    return (Math.round(amount * 100) / 100).toFixed(2)
  }

  static getTransactionTypeForAccounts({ source, destination }) {
    if (!source && !destination) {
      return this.types.expense
    }
    // if (Account.getType(source).fireflyCode === Account.types.revenue.fireflyCode || !source) {
    if (isEqual(Account.getType(source), Account.types.revenue) || !source) {
      return this.types.income
    }

    if (isEqual(Account.getType(source), Account.types.asset) && isEqual(Account.getType(destination), Account.types.asset)) {
      return this.types.transfer
    }

    return this.types.expense
  }
}

export default Transaction
