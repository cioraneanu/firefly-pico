import { cloneDeep, get } from 'lodash-es'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import LanguageUtils from '~/core/utils/LanguageUtils.js'

const apiKeys = { description: 'description', amount: 'amount', category: 'category_id', tags: 'tags' }

// Edits a transaction's main fields in place (desktop table edit mode): every change saves right away
// and onSaved gets the transaction Firefly returns. Split transactions keep the dialog.
// Saves run one after another and send only the changed field, so quick edits never revert each other.
export function useTransactionInlineEdit(transaction, onSaved) {
  const isSaving = ref(false)
  const split = computed(() => Transaction.getFirstSplit(toValue(transaction)))

  // Changes not saved yet: shown at once, so the next change builds on them
  const pending = ref({})
  const value = (key) => (key in pending.value ? pending.value[key] : split.value?.[key])
  let queue = Promise.resolve()

  const save = (changes) => {
    Object.assign(pending.value, changes)
    queue = queue.then(() => send(changes))
  }

  const send = async (changes) => {
    isSaving.value = true
    const item = cloneDeep(toValue(transaction))
    Object.assign(Transaction.getFirstSplit(item), changes)
    const api = TransactionTransformer.transformToApi(item)
    const payload = { transaction_journal_id: split.value.transaction_journal_id }
    Object.keys(changes).forEach((key) => (payload[apiKeys[key]] = api.transactions[0][apiKeys[key]]))
    if (changes.tags) payload.tags = [...payload.tags, ...(await unknownTagNames())]

    const response = await new TransactionRepository().update(item.id, { ...api, transactions: [payload] })
    isSaving.value = false
    if (ResponseUtils.isSuccess(response)) onSaved(TransactionTransformer.transformFromApi(get(response, 'data.data')))
    // Drop what this save sent, unless a newer change of the same field is waiting (a failed save shows the server value again)
    Object.keys(changes).forEach((key) => toRaw(pending.value)[key] === changes[key] && delete pending.value[key])
  }

  // Tags Pico has not synced are undefined after transformFromApi: read their names from Firefly so a tag change keeps them
  const unknownTagNames = async () => {
    if (!split.value?.tags?.some((tag) => !tag)) return []
    const names = get(await new TransactionRepository().getOne(toValue(transaction).id), 'data.attributes.transactions.0.tags') ?? []
    return names.filter((name) => !useTagStore().tagDictionaryByName[LanguageUtils.removeAccentsAndLowerCase(name)])
  }

  // Selects save when picked; text inputs keep what is typed until change (blur / Enter): a valid new value saves, anything else shows the saved value again
  const field = (key) => computed({ get: () => value(key), set: (newValue) => save({ [key]: newValue }) })
  const textField = (key, isValid) => {
    const typed = ref(null)
    const model = computed({ get: () => typed.value ?? value(key), set: (newValue) => (typed.value = newValue) })
    const commit = () => {
      const newValue = typed.value
      typed.value = null
      if (newValue !== null && isValid(String(newValue))) save({ [key]: String(newValue) })
    }
    return [model, commit]
  }

  const [description, saveDescription] = textField('description', (text) => !!text && text !== value('description'))
  const [amount, saveAmount] = textField('amount', (text) => parseFloat(text) > 0 && parseFloat(text) !== parseFloat(value('amount')))
  const tags = computed({ get: () => (value('tags') ?? []).filter(Boolean), set: (newValue) => save({ tags: newValue }) })

  return { isSaving, description, amount, saveDescription, saveAmount, category: field('category'), tags }
}
