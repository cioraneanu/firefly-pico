import { onMounted, ref } from 'vue'
import { deleteWithUndo, withoutDeleted } from '~/core/utils/DeleteUtils'
import _, { get } from 'lodash-es'

// by convention, composable function names start with "use"
export function useList(prop) {
  const { title, routeList, routeForm } = prop
  const { model, onEvent } = prop
  const propOnLoadMore = prop.onLoadMore
  const propGetAll = prop.getAll
  const transformer = model.getTransformer()
  const repository = model.getRepository()

  const pageSize = ref(50)
  const page = ref(0)
  const listTotalCount = ref(0)
  const totalPages = ref(0)

  const items = ref([])
  // Hides the items whose delete waits behind an Undo toast
  const list = computed({ get: () => withoutDeleted(items.value), set: (value) => (items.value = value) })
  const listPagination = ref(null)
  const isLoading = ref(false)
  const isFinished = ref(false)
  const isRefreshing = ref(false)

  //   v-model:loading="isLoading"
  // :finished="isListFinished"
  //   finished-text="End of list"
  // @load="onLoadList"

  const isEmpty = computed(() => !list.value || list.value.length === 0)

  const onAdd = async () => await navigateTo(routeForm)

  const onEdit = async (transaction) => {
    await navigateTo(`${routeForm}/${transaction.id}`)
  }
  const onLoadMore = async () => {
    if (isLoading.value) {
      return
    }
    isLoading.value = true

    page.value = page.value + 1

    let result = {}

    if (propOnLoadMore) {
      let newList = await propOnLoadMore({
        page: page.value,
        pageSize: pageSize.value,
      })
      result = {
        data: newList,
      }
    } else {
      if (propGetAll) {
        result = await propGetAll({
          page: page.value,
          pageSize: pageSize.value,
        })
      } else {
        result = await repository.getAll({
          page: page.value,
          pageSize: pageSize.value,
        })
      }
    }
    let newList = get(result, 'data', [])
    listPagination.value = get(result, 'meta.pagination')

    if (transformer) {
      newList = transformer.transformFromApiList(newList)
    }

    items.value = isRefreshing.value ? newList : [...items.value, ...newList]

    // list.value.push(...newList)

    pageSize.value = _.get(result, 'meta.pagination.per_page') || pageSize.value
    page.value = _.get(result, 'meta.pagination.current_page', 0)
    totalPages.value = _.get(result, 'meta.pagination.total_pages', 0)
    listTotalCount.value = _.get(result, 'meta.pagination.total', 0)

    // Only an empty page ends the list. Don't rely on the pagination meta alone => Firefly's search
    // endpoint reports totals for all transactions, not just the matches. And don't treat a short page
    // as the last one either => Firefly paginates by journal but returns groups, so a page containing
    // a split transaction has fewer groups than the page size while more pages still follow.
    isFinished.value = page.value >= totalPages.value || newList.length === 0
    if (isFinished.value) {
      listTotalCount.value = list.value.length
    }
    isLoading.value = false
  }

  const onRefresh = async () => {
    isRefreshing.value = true

    // list.value = []
    page.value = 0
    await onLoadMore()
    isRefreshing.value = false
  }

  const onDelete = async (item) => {
    const response = await deleteWithUndo(item, () => repository.delete(item.id))
    if (ResponseUtils.isSuccess(response)) {
      items.value = items.value.filter((currentItem) => currentItem.id !== item.id)
      onEvent ? onEvent('onPostDelete', item) : null
    }
  }

  // Swaps in an item saved somewhere else (desktop inline edit)
  const onReplace = (item) => (items.value = items.value.map((currentItem) => (currentItem.id === item.id ? item : currentItem)))

  // -----------------------------

  // -----------------------------

  onMounted(async () => {
    // await onLoadMore()
  })

  return {
    title,
    list,
    isEmpty,
    isLoading,
    isFinished,
    isRefreshing,
    listPagination,
    page,
    pageSize,
    totalPages,
    listTotalCount,
    onAdd,
    onEdit,
    onLoadMore,
    onRefresh,
    onDelete,
    onReplace,
  }
}
