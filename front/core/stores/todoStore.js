import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chunk, cloneDeep, get } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils'
import { areIntEqual } from '~/core/utils/DataUtils'
import { getActiveFilters } from '~/core/utils/FilterUtils'
import { withoutDeleted } from '~/core/utils/DeleteUtils'
import UIUtils from '~/core/utils/UIUtils'
import { getTodoJournalIds, getTodoTagUpdate } from '~/core/utils/TodoTagUpdate'

// TODO Inbox: transactions tagged with the todo tag, reviewed one by one.
// "Mark as done" only removes the todo tag. What was marked as done stays listed for this session (not persisted),
// so it can be edited again or get its todo tag back.
// The one source for the inbox, its badges (sidebar, Extras) and the dashboard cards.
// Extra list filters (the transaction filters bag) narrow the inbox and are kept in localStorage.
export const useTodoStore = defineStore('todo', () => {
  const todoList = ref([])
  const doneList = ref([])
  const isLoading = ref(false)
  const removedTodoJournals = new Map()
  const pendingTagChanges = new Set()

  const reviveDates = (bag) => ({ ...bag, dateStart: bag.dateStart && new Date(bag.dateStart), dateEnd: bag.dateEnd && new Date(bag.dateEnd) })
  const filters = useLocalStorage('todoInboxFilters', {}, { serializer: { read: (value) => reviveDates(JSON.parse(value)), write: JSON.stringify } })
  const activeFilters = computed(() => getActiveFilters(Object.values(TransactionFilterUtils.filters), filters.value))
  const setFilters = (value) => {
    filters.value = value ?? {}
    return fetchTodo()
  }

  const isTodoTag = (name) => LanguageUtils.removeAccentsAndLowerCase(name) === LanguageUtils.removeAccentsAndLowerCase(Tag.getDisplayName(useTagStore().tagTodo))

  // The transformer swaps tag names for the synced tags: keep the raw names too, so saving never drops a tag Pico does not know yet
  const fromApi = (item) => {
    Transaction.getSplits(item).forEach((split) => (split.tagNames = [...(split.tags ?? [])]))
    return TransactionTransformer.transformFromApi(item)
  }

  const hasTodoTag = (transaction) => Transaction.getSplits(transaction).some((split) => (split.tagNames ?? []).some(isTodoTag))
  const without = (list, ids) => list.filter((item) => !ids.some((id) => areIntEqual(id, item.id)))
  const byDateDesc = (a, b) => Transaction.getDate(b) - Transaction.getDate(a)

  // Rows hidden behind a pending Undo delete are not shown or counted
  const visibleTodoList = computed(() => withoutDeleted(todoList.value))
  const visibleDoneList = computed(() => withoutDeleted(doneList.value))
  const totalCount = computed(() => visibleTodoList.value.length + visibleDoneList.value.length)

  // Loaded once at app start for the badges; the dashboard, the inbox page and its actions refresh it
  let isFetched = false
  const fetchTodoOnce = () => isFetched || fetchTodo()

  const getQuery = () => [TransactionFilterUtils.filters.tag.filter(useTagStore().tagTodo), ...activeFilters.value.map((filter) => filter.filter)].join(' ')

  // A load already running (app start + dashboard) is not fired twice; filters changed meanwhile load again right after
  async function fetchTodo() {
    if (isLoading.value) return
    if (!useTagStore().tagTodo) {
      todoList.value = []
      return
    }
    isFetched = true
    isLoading.value = true
    const query = getQuery()
    const list = await new TransactionRepository().getAllWithMerge({
      filters: [{ field: 'query', value: query }],
      getAll: (params) => new TransactionRepository().searchTransaction({ ...params, showLoading: false }),
    })
    todoList.value = list.map(fromApi)
    todoList.value.forEach((item) => removedTodoJournals.delete(String(item.id)))
    doneList.value = without(
      doneList.value,
      todoList.value.map((item) => item.id),
    )
    isLoading.value = false
    if (query !== getQuery()) return fetchTodo()
  }

  // Search results can omit splits, and their tags can change while the Inbox is open.
  async function updateTags(transaction, isTodo) {
    const id = String(transaction.id)
    if (pendingTagChanges.has(id)) return true
    pendingTagChanges.add(id)
    try {
      const tagName = Tag.getDisplayName(useTagStore().tagTodo)
      if (!tagName) return false

      const repository = new TransactionRepository()
      const latest = await repository.getTodoTransaction(id)
      const receipt = removedTodoJournals.get(id)
      const journalIds = isTodo ? (receipt?.tagName === tagName ? receipt.journalIds : []) : getTodoJournalIds(latest, tagName)
      const update = getTodoTagUpdate(latest, tagName, journalIds, isTodo)
      if (!update || tagName !== Tag.getDisplayName(useTagStore().tagTodo)) return false

      const response = await repository.updateTodoTags(id, update)
      if (response?.status >= 400 && response.status < 500) return false
      // A response can go missing after Firefly applied the write. Read it back instead of retrying.
      const saved = get(response, 'data.data') ?? (await repository.getTodoTransaction(id))
      if (!saved?.attributes?.transactions?.length) return false
      const markedIds = getTodoJournalIds(saved, tagName)
      if (isTodo ? !journalIds.every((journalId) => markedIds.includes(journalId)) : markedIds.length > 0) return false

      onSaved(fromApi(saved), { tagName, journalIds })
      return true
    } finally {
      pendingTagChanges.delete(id)
    }
  }

  // A few requests at a time; the user hears about the ones that failed
  async function setTodo(transactions, isTodo) {
    let failedCount = 0
    for (const batch of chunk(transactions, 5)) {
      const results = await Promise.all(batch.map((transaction) => updateTags(transaction, isTodo)))
      failedCount += results.filter((result) => !result).length
    }
    if (failedCount) UIUtils.showToastError(useNuxtApp().$i18n.t('todo_page.some_failed', { count: failedCount }))
  }

  const markDone = (transactions) => setTodo(transactions, false)
  const putBack = (transactions) => setTodo(transactions, true)

  // A transaction saved anywhere in the inbox goes to the list its tags say
  function onSaved(transaction, receipt) {
    if (!transaction) return
    const isTodo = hasTodoTag(transaction)
    const ids = [transaction.id]
    const id = String(transaction.id)
    if (isTodo) {
      removedTodoJournals.delete(id)
    } else if (receipt) {
      removedTodoJournals.set(id, receipt)
    } else {
      // A regular save can also remove the marker. Retain the known journal IDs for Put Back.
      const previous = todoList.value.find((item) => areIntEqual(item.id, id))
      const journalIds = Transaction.getSplits(previous)
        .filter((split) => split.transaction_journal_id && split.tagNames?.some(isTodoTag))
        .map((split) => String(split.transaction_journal_id))
      if (journalIds.length) removedTodoJournals.set(id, { tagName: Tag.getDisplayName(useTagStore().tagTodo), journalIds })
    }
    todoList.value = isTodo ? [...without(todoList.value, ids), transaction].sort(byDateDesc) : without(todoList.value, ids)
    doneList.value = isTodo ? without(doneList.value, ids) : [transaction, ...without(doneList.value, ids)]
  }

  function onDeleted(id) {
    removedTodoJournals.delete(String(id))
    todoList.value = without(todoList.value, [id])
    doneList.value = without(doneList.value, [id])
  }

  // The editor works on its own copy, with the todo tag taken off for "Save & done"
  function withoutTodoTag(transaction) {
    const result = cloneDeep(transaction)
    Transaction.getSplits(result).forEach((split) => (split.tags = (split.tags ?? []).filter((tag) => !get(tag, 'attributes.is_todo'))))
    return result
  }

  return {
    todoList,
    doneList,
    visibleTodoList,
    visibleDoneList,
    isLoading,
    totalCount,
    filters,
    activeFilters,
    setFilters,
    fetchTodo,
    fetchTodoOnce,
    markDone,
    putBack,
    onSaved,
    onDeleted,
    fromApi,
    withoutTodoTag,
  }
})
