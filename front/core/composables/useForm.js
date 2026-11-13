import { onMounted, ref } from 'vue'
import { get, cloneDeep } from 'lodash-es'
import UIUtils from '~/core/utils/UIUtils'
import { getGUID } from '~/core/utils/Utils.js'
import { deleteWithUndo } from '~/core/utils/DeleteUtils'

export const useFormEvent = {
  postFetch: 'postFetch',
  postSave: 'onPostSave',
  postDelete: 'onPostDelete',
}

export function useForm(props) {
  // resetOnCreate (ref): whether creating empties the form for the next one; defaults to profileStore.resetFormOnCreate
  const { routeList, routeForm, shouldFetchOnMount = true, resetOnCreate = null } = props
  const { model, resetFields, onEvent, fetchItem: fetchItem_ } = props

  const transformer = model.getTransformer()
  const repository = model.getRepository()

  let profileStore = useProfileStore()
  const { t } = useI18n()

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

  // Enter, key repeat or a double click can submit again while a save runs: ignore those
  let isSaving = false

  async function saveItem() {
    if (isSaving) return
    isSaving = true
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
      UIUtils.showToastSuccess(t('success'))
      onEvent?.(useFormEvent.postSave, response)

      // Should reset form
      if (!itemId.value && (toValue(resetOnCreate) ?? profileStore.resetFormOnCreate)) {
        item.value = model.getEmpty()
        resetFields ? resetFields() : null
      } else {
        let responseId = get(response, 'data.data.id')
        routeForm ? await navigateTo(`${routeForm}/${responseId}`) : null
      }
    }

    isSaving = false
    return response
  }

  const onDelete = async () => {
    const id = itemId.value
    const response = await deleteWithUndo(item.value, () => repository.delete(id), { leave: routeList && (() => navigateTo(routeList)), undoable: !!routeList })
    if (ResponseUtils.isSuccess(response)) {
      onEvent ? onEvent(useFormEvent.postDelete, response) : null
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
    UIUtils.showToastError(t('validation.form_invalid'))
    scrollToError(errorInfo)
  }

  const scrollToError = (errorInfo) => {
    let errorFields = (errorInfo.errors ?? []).map((item) => item.name).filter((item) => item)
    const formElement = document.querySelector(`form[name="${formName.value}"]`)
    if (!formElement) {
      return
    }

    let topField = errorFields.map((item) => formElement.querySelector(`[name="${item}"]`)).find((item) => item)

    topField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  onMounted(async () => {
    if (shouldFetchOnMount) {
      await initItem({ id: useRoute().params?.id })
    }
  })

  // ----- Loading indicators -----

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
