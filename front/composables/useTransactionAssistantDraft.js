import { cloneDeep } from 'lodash-es'
import Transaction from '~/models/Transaction'
import { useTransactionForm } from '~/composables/useTransactionForm.js'

export const useTransactionAssistantDraft = () => {
  const item = ref(new Transaction().getEmpty())
  const itemId = computed(() => null)
  const { applyAssistantTransaction } = useTransactionForm({ item, itemId })

  const buildTransactionItemFromAssistant = async (assistantTransaction) => {
    await applyAssistantTransaction(assistantTransaction)
    await nextTick()
    return cloneDeep(item.value)
  }

  return {
    buildTransactionItemFromAssistant,
  }
}
