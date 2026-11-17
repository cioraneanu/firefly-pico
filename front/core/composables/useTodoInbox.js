// State of the TODO Inbox page, shared by the desktop and mobile pages
export function useTodoInbox() {
  const todoStore = useTodoStore()

  const isDoneView = ref(false)
  const isBusy = ref(false)

  const list = computed(() => (isDoneView.value ? todoStore.visibleDoneList : todoStore.visibleTodoList))
  const todoCount = computed(() => todoStore.visibleTodoList.length)
  const doneCount = computed(() => todoStore.visibleDoneList.length)
  const progress = computed(() => (todoStore.totalCount ? Math.round((doneCount.value / todoStore.totalCount) * 100) : 0))
  const isPanelVisible = computed(() => (isDoneView.value ? doneCount.value : todoCount.value) > 0)

  // "Mark all done" / "Put all back" on the shown rows; the buttons stay disabled while it runs
  const runAll = async (action, transactions) => {
    isBusy.value = true
    await action(transactions)
    isBusy.value = false
  }
  const onMarkAllDone = (transactions) => runAll(todoStore.markDone, transactions)
  // Back to the review only once nothing is left in the done list (not after a searched subset or failures)
  const onPutBackAll = async (transactions) => {
    await runAll(todoStore.putBack, transactions)
    if (!doneCount.value) isDoneView.value = false
  }

  // The extra filters (kept by the store) reload the inbox when they change
  const filters = computed({ get: () => todoStore.filters, set: todoStore.setFilters })
  const removeFilter = (bagKey) => todoStore.setFilters({ ...todoStore.filters, [bagKey]: null })
  const clearFilters = () => todoStore.setFilters({})

  return { isDoneView, isBusy, list, todoCount, doneCount, progress, isPanelVisible, onMarkAllDone, onPutBackAll, filters, removeFilter, clearFilters }
}
