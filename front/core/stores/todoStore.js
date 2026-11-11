import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cloneDeep, get } from 'lodash-es'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils'
import { areIntEqual } from '~/core/utils/DataUtils'

// TODO Inbox: transactions tagged with the todo tag, reviewed one by one.
// "Mark as done" only removes the todo tag. What was marked as done stays listed for this session (not persisted),
// so it can be edited again or get its todo tag back.
export const useTodoStore = defineStore('todo', () => {
  const todoList = ref([])
  const doneList = ref([])
  const isLoading = ref(false)

  const isTodoTag = (name) => LanguageUtils.removeAccentsAndLowerCase(name) === LanguageUtils.removeAccentsAndLowerCase(Tag.getDisplayName(useTagStore().tagTodo))

  // The transformer swaps tag names for the synced tags: keep the raw names too, so saving never drops a tag Pico does not know yet
  const fromApi = (item) => {
    Transaction.getSplits(item).forEach((split) => (split.tagNames = [...(split.tags ?? [])]))
    return TransactionTransformer.transformFromApi(item)
  }

  const hasTodoTag = (transaction) => Transaction.getSplits(transaction).some((split) => (split.tagNames ?? []).some(isTodoTag))
  const without = (list, ids) => list.filter((item) => !ids.some((id) => areIntEqual(id, item.id)))
  const byDateDesc = (a, b) => Transaction.getDate(b) - Transaction.getDate(a)

  const totalCount = computed(() => todoList.value.length + doneList.value.length)

  async function fetchTodo() {
    const tagTodo = useTagStore().tagTodo
    if (!tagTodo) {
      todoList.value = []
      return
    }
    isLoading.value = true
    const filters = [{ field: 'query', value: TransactionFilterUtils.filters.tag.filter(tagTodo) }]
    const list = await new TransactionRepository().getAllWithMerge({ filters, getAll: new TransactionRepository().searchTransaction })
    todoList.value = list.map(fromApi)
    doneList.value = without(
      doneList.value,
      todoList.value.map((item) => item.id),
    )
    isLoading.value = false
  }

  // Only the tags change: each split is sent with its journal id and its new tag list, nothing else
  async function updateTags(transaction, isTodo) {
    const tagTodoName = Tag.getDisplayName(useTagStore().tagTodo)
    const transactions = Transaction.getSplits(transaction).map((split) => {
      const tags = (split.tagNames ?? []).filter((name) => !isTodoTag(name))
      return { transaction_journal_id: split.transaction_journal_id, tags: isTodo ? [tagTodoName, ...tags] : tags }
    })
    const response = await new TransactionRepository().update(transaction.id, { transactions })
    return ResponseUtils.isSuccess(response) ? fromApi(get(response, 'data.data')) : null
  }

  async function setTodo(transactions, isTodo) {
    const results = await Promise.all(transactions.map((transaction) => updateTags(transaction, isTodo)))
    results.filter(Boolean).forEach(onSaved)
    useDashboardStore().fetchTransactionsWithTodos()
  }

  const markDone = (transactions) => setTodo(transactions, false)
  const putBack = (transactions) => setTodo(transactions, true)

  // A transaction saved anywhere in the inbox goes to the list its tags say
  function onSaved(transaction) {
    const isTodo = hasTodoTag(transaction)
    const ids = [transaction.id]
    todoList.value = isTodo ? [...without(todoList.value, ids), transaction].sort(byDateDesc) : without(todoList.value, ids)
    doneList.value = isTodo ? without(doneList.value, ids) : [transaction, ...without(doneList.value, ids)]
  }

  function onDeleted(id) {
    todoList.value = without(todoList.value, [id])
    doneList.value = without(doneList.value, [id])
  }

  // The editor works on its own copy, with the todo tag taken off for "Save & done"
  function withoutTodoTag(transaction) {
    const result = cloneDeep(transaction)
    Transaction.getSplits(result).forEach((split) => (split.tags = (split.tags ?? []).filter((tag) => !get(tag, 'attributes.is_todo'))))
    return result
  }

  return { todoList, doneList, isLoading, totalCount, fetchTodo, markDone, putBack, onSaved, onDeleted, fromApi, withoutTodoTag }
})
