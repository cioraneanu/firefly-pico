import { cloneDeep, get } from 'lodash-es'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'

// Edits a transaction's main fields in place (desktop table edit mode): every change saves right away
// and onSaved gets the transaction Firefly returns. Split transactions keep the dialog.
export function useTransactionInlineEdit(transaction, onSaved) {
  const isSaving = ref(false)
  const split = computed(() => Transaction.getFirstSplit(toValue(transaction)))

  const save = async (changes) => {
    const item = cloneDeep(toValue(transaction))
    Object.assign(Transaction.getFirstSplit(item), changes)
    isSaving.value = true
    const response = await new TransactionRepository().update(item.id, TransactionTransformer.transformToApi(item))
    isSaving.value = false
    if (ResponseUtils.isSuccess(response)) onSaved(TransactionTransformer.transformFromApi(get(response, 'data.data')))
  }

  // Selects save when picked; text inputs keep a draft and save on change (blur / Enter)
  const field = (key) => computed({ get: () => split.value?.[key], set: (value) => save({ [key]: value }) })
  const draft = (key) => {
    const value = ref(split.value?.[key])
    watch(() => split.value?.[key], (newValue) => (value.value = newValue))
    return value
  }

  const description = draft('description')
  const amount = draft('amount')
  const saveDescription = () => description.value && description.value !== split.value.description && save({ description: description.value })
  const saveAmount = () => parseFloat(amount.value) > 0 && parseFloat(amount.value) !== parseFloat(split.value.amount) && save({ amount: String(amount.value) })
  const tags = computed({ get: () => (split.value?.tags ?? []).filter(Boolean), set: (value) => save({ tags: value }) })

  return { isSaving, description, amount, saveDescription, saveAmount, category: field('category'), tags }
}
