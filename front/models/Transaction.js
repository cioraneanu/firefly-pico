import _, { get, isEqual } from 'lodash'
import Account from '~/models/Account'
import BaseModel from '~/models/BaseModel'
import TransactionRepository from '~/repository/TransactionRepository'
import { useAppStore } from '~/stores/appStore'
import TransactionTransformer from '~/transformers/TransactionTransformer'

class Transaction extends BaseModel {
  getTransformer() {
    return TransactionTransformer
  }

  getRepository() {
    return new TransactionRepository()
  }

  getEmpty() {
    const appStore = useAppStore()

    let type =
      Transaction.getTransactionTypeForAccounts({
        source: appStore.defaultAccountSource,
        destination: appStore.defaultAccountDestination,
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
            tags: appStore.defaultTags,
            description: '',
            notes: '',
            accountSource: appStore.defaultAccountSource,
            accountDestination: appStore.defaultAccountDestination,
            type: type,
            category: appStore.defaultCategory,
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
        name: 'Expense',
        code: 'expense',
        fireflyCode: 'withdrawal',
      },
      income: {
        name: 'Income',
        code: 'income',
        fireflyCode: 'deposit',
      },
      transfer: {
        name: 'Transfer',
        code: 'transfer',
        fireflyCode: 'transfer',
      },
    }
  }

  static get typesList() {
    return Object.values(this.types)
  }

  // -----

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
    return get(transaction, 'attributes.transactions.0.tags', [])
  }

  static getCategoryId(transaction) {
    return get(transaction, 'attributes.transactions.0.category_id', 0)
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

    if (
      isEqual(Account.getType(source), Account.types.asset) &&
      isEqual(Account.getType(destination), Account.types.asset)
    ) {
      return this.types.transfer
    }

    return this.types.expense
  }
}

export default Transaction
