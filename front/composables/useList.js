import { onMounted, ref } from 'vue'
import UIUtils from '~/utils/UIUtils'
import _, { get } from 'lodash'

// by convention, composable function names start with "use"
export function useList(prop) {
  // const dataStore = useDataStore()

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

  const list = ref([])
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

    // let result = await new TransactionRepository().getAll()
    // dataStore.transactionList = result.data
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

    list.value = isRefreshing.value ? newList : [...list.value, ...newList]

    // list.value.push(...newList)

    pageSize.value = _.get(result, 'meta.pagination.per_page', 0)
    page.value = _.get(result, 'meta.pagination.current_page', 0)
    totalPages.value = _.get(result, 'meta.pagination.total_pages', 0)
    listTotalCount.value = _.get(result, 'meta.pagination.total', 0)

    // await new Promise(resolve => setTimeout(resolve, 3000))
    isFinished.value = page.value >= totalPages.value
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
    let result = await UIUtils.showDeleteConfirmation('Delete confirmation', 'Are you sure you want to delete this?')
    if (result) {
      let response = await repository.delete(item.id)
      if (ResponseUtils.isSuccess(response)) {
        UIUtils.showToastSuccess(`Deleted successfully.`, 1000)
        list.value = list.value.filter((currentItem) => currentItem.id !== item.id)
        onEvent ? onEvent('onPostDelete', item) : null
      }
    }
  }

  // -----------------------------

  UIUtils.showLoadingWhen(isLoading)

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
  }
}
