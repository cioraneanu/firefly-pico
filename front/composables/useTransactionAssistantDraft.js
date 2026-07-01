import { cloneDeep } from 'lodash-es'
import Transaction from '~/models/Transaction'
import { useTransactionFormBindings } from '~/composables/useTransactionFormBindings.js'

export const useTransactionAssistantDraft = () => {
  const item = ref(new Transaction().getEmpty())
  const itemId = computed(() => null)
  const { applyAssistantTransaction } = useTransactionFormBindings({ item, itemId })

  const buildTransactionItemFromAssistant = async (assistantTransaction) => {
    await applyAssistantTransaction(assistantTransaction)
    await nextTick()
    return cloneDeep(item.value)
  }

  return {
    buildTransactionItemFromAssistant,
  }
}
