import { capitalize, get, isEqual } from 'lodash-es'
import { formatTimeAgo } from '@vueuse/core'
import { marked } from 'marked'
import DateUtils from '~/utils/DateUtils'
import Transaction from '~/models/Transaction'
import { transactionListFieldList } from '~/constants/TransactionConstants.js'
import { useAccountStore } from '~/stores/accountStore'
import { useProfileStore } from '~/stores/profileStore'

export function useTransactionListItem(props) {
  const accountStore = useAccountStore()
  const profileStore = useProfileStore()

  const firstTransaction = computed(() => Transaction.getFirstSplit(props.value))
  const transactionType = computed(() => get(firstTransaction.value, 'type', ' - '))

  const isTypeExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
  const isTypeIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))
  const isTypeTransfer = computed(() => isEqual(transactionType.value, Transaction.types.transfer))

  const sourceAccount = computed(() => {
    const sourceId = get(firstTransaction.value, 'source_id')
    return get(accountStore.accountDictionary, sourceId)
  })

  const destinationAccount = computed(() => {
    const destinationId = get(firstTransaction.value, 'destination_id')
    return get(accountStore.accountDictionary, destinationId)
  })

  const displayedAccounts = computed(() => [sourceAccount.value, destinationAccount.value].filter(Boolean))
  const description = computed(() => Transaction.getDescription(props.value))
  const hasAttachments = computed(() => Transaction.hasAttachments(props.value))
  const isSplitPayment = computed(() => Transaction.isSplitPayment(props.value))
  const categories = computed(() => Transaction.getCategories(props.value) ?? [])
  const tags = computed(() => Transaction.getTags(props.value) ?? [])
  const budget = computed(() => get(firstTransaction.value, 'budget'))

  const notes = computed(() => {
    const result = Transaction.getNotes(props.value)
    return result ? marked(result) : null
  })

  const isTodo = computed(() => tags.value.some((tag) => get(tag, 'attributes.is_todo')))
  const cellClass = computed(() => ({
    'transaction-list-item-todo': isTodo.value,
  }))
  const typeClass = computed(() => ({
    'color-expense': isTypeExpense.value,
    'color-income': isTypeIncome.value,
    'color-transfer': isTypeTransfer.value,
  }))

  const visibleTags = computed(() => tags.value.slice(0, 4))
  const amountSign = computed(() => (isTypeExpense.value ? '-' : isTypeIncome.value ? '+' : ''))
  const transactionAmount = computed(() => `${amountSign.value}${Transaction.getAmountFormatted(props.value)}`)
  const transactionCurrency = computed(() => get(firstTransaction.value, 'currency_symbol', ' - '))

  const date = computed(() => DateUtils.autoToDate(get(firstTransaction.value, 'date')))
  const dateFormatted = computed(() => DateUtils.dateToUI(date.value))
  const timeAgo = computed(() => (date.value ? capitalize(formatTimeAgo(date.value)) : ''))

  const getStyleForField = ({ code }) => {
    const fieldsConfig = Array.isArray(profileStore.transactionListFieldsConfig) ? profileStore.transactionListFieldsConfig : transactionListFieldList
    const position = fieldsConfig.findIndex((item) => item.code === code)
    const field = fieldsConfig.find((item) => item.code === code)
    const isVisible = field ? field.isVisible : true

    return {
      order: position >= 0 ? position : 0,
      display: isVisible ? undefined : 'none',
    }
  }

  const amountStyle = computed(() => {
    if (isTypeExpense.value) {
      return { color: 'var(--expense2)' }
    }
    if (isTypeIncome.value) {
      return { color: 'var(--income1)' }
    }
    if (isTypeTransfer.value) {
      return { color: 'var(--transfer1)' }
    }
    return {}
  })

  return {
    profileStore,
    firstTransaction,
    isTypeExpense,
    isTypeIncome,
    isTypeTransfer,
    isSplitPayment,
    displayedAccounts,
    description,
    hasAttachments,
    categories,
    notes,
    tags,
    budget,
    cellClass,
    typeClass,
    visibleTags,
    transactionAmount,
    transactionCurrency,
    dateFormatted,
    timeAgo,
    getStyleForField,
    amountStyle,
  }
}
