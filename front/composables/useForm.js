import { onMounted, ref } from 'vue'
import { get, cloneDeep } from 'lodash'
import UIUtils from '~/utils/UIUtils'
import { next } from 'lodash/seq'
import { getGUID } from '~/utils/Utils.js'

export const useFormEvent = {
  postFetch: 'postFetch',
  postSave: 'onPostSave',
  postDelete: 'onPostDelete',
}

export function useForm(props) {
  const { routeList, routeForm, shouldFetchOnMount = true } = props
  const { model, resetFields, onEvent, fetchItem: fetchItem_ } = props

  const transformer = model.getTransformer()
  const repository = model.getRepository()

  let profileStore = useProfileStore()

  let formName = ref(`form-${getGUID()}`)

  let isLoading = ref(false)
  let item = ref({})
  let itemId = computed(() => item.value?.id)

  let fetchedItem = ref({})

  // --

  const onClickBack = async () => {
    await navigateTo(routeList)
  }

  async function initItem({ id = null, value = null } = {}) {
    let itemValue = value ? cloneDeep(value) : cloneDeep(model.getEmpty())
    item.value = itemValue
    id ? await fetchItem(id) : null
  }

  async function fetchItem(id) {
    if (fetchItem_) {
      fetchItem_(id)
      return
    }

    isLoading.value = true
    let newValue = await repository.getOne(id)
    newValue = newValue.data
    newValue = transformer ? transformer.transformFromApi(newValue) : newValue
    item.value = newValue
    fetchedItem.value = cloneDeep(newValue)

    await nextTick()
    isLoading.value = false

    onEvent?.(useFormEvent.postFetch)
  }

  async function saveItem() {
    isLoading.value = true

    let newItem = item.value
    newItem = transformer ? transformer.transformToApi(newItem) : newItem

    let response = null
    if (itemId.value) {
      response = await repository.update(itemId.value, newItem)
    } else {
      response = await repository.insert(newItem)
    }
    isLoading.value = false

    if (ResponseUtils.isSuccess(response)) {
      UIUtils.showToastSuccess('Success')
      onEvent?.(useFormEvent.postSave, response)

      // Should reset form
      if (!itemId.value && profileStore.resetFormOnCreate) {
        item.value = model.getEmpty()
        resetFields ? resetFields() : null
      } else {
        let responseId = get(response, 'data.data.id')
        routeForm ? await navigateTo(`${routeForm}/${responseId}`) : null
      }
    }

    return response
  }

  const onDelete = async () => {
    let result = await UIUtils.showDeleteConfirmation('Delete confirmation', 'Are you sure you want to delete this?')
    if (result) {
      let response = await repository.delete(itemId.value)
      if (ResponseUtils.isSuccess(response)) {
        onEvent ? onEvent(useFormEvent.postDelete, response) : null
        routeList ? await navigateTo(routeList) : null
        UIUtils.showToastSuccess(`Deleted successfully.`, 1000)
      }
    }
  }

  const onNew = async () => {
    if (itemId.value) {
      await navigateTo(routeForm)
      return
    }

    // Call external reset function if user provided one...
    resetFields ? resetFields() : null
  }

  const onValidationError = (errorInfo) => {
    UIUtils.showToastError('Form has invalid values. Check the red fields :)')
    scrollToError(errorInfo)
  }

  const scrollToError = (errorInfo) => {
    let errorFields = (errorInfo.errors ?? []).map((item) => item.name).filter((item) => item)
    const formElement = document.querySelector(`.van-form[name="${formName.value}"]`)
    if (!formElement) {
      return
    }

    let topField = errorFields
      .map((item) => formElement.querySelector(`[name="${item}"]`))
      .filter((item) => item)
      .reduce((result, item) => (item.offsetTop > (result.offsetTop ?? 0) ? item : result))

    topField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  onMounted(async () => {
    if (shouldFetchOnMount) {
      await initItem({ id: useRoute().params?.id })
    }
  })

  // ----- Loading indicators -----

  UIUtils.showLoadingWhen(isLoading)

  // -----------------------------

  return {
    itemId,
    item,
    fetchedItem,
    isLoading,
    onClickBack,
    onNew,
    saveItem,
    onDelete,
    onValidationError,
    formName,
  }
}
