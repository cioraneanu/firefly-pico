import { onMounted, ref } from 'vue'
import _ from 'lodash'
import UIUtils from '~/utils/UIUtils'
import { next } from 'lodash/seq'

// by convention, composable function names start with "use"
export function useForm(props) {
  const { form } = props
  const { titleAdd, titleEdit } = props
  const { routeList, routeForm } = props
  const { model, resetFields, onEvent } = props
  const fetchItemExternal = props.fetchItem

  const transformer = model.getTransformer()
  const repository = model.getRepository()

  // let dataStore = useDataStore()
  // let profileStore = useProfileStore()
  const route = useRoute()

  const title = computed(() => (route.params.id ? titleEdit : titleAdd))

  let itemId = ref(null)
  let formName = ref(`form-${crypto.randomUUID()}`)

  // let itemId = computed(() => route.params.id)

  watch(
    () => route.params.id,
    async (newValue, oldValue) => {
      itemId.value = newValue
    },
    { immediate: true },
  )

  let isLoading = ref(false)
  let item = ref({})
  let fetchedItem = ref({})

  const addButtonText = computed(() => {
    if (itemId.value) {
      return 'New'
    }
    if (!isEmpty.value) {
      return 'Reset'
    }
    return null
  })

  const isEmpty = computed(() => {
    return !name.value
  })

  // --

  const onClickBack = async () => {
    await navigateTo(routeList)
  }

  async function initItem() {
    // isLoading.value = true

    if (itemId.value) {
      await fetchItem()
    } else {
      item.value = model.getEmpty()
    }

    // isLoading.value = false
  }

  async function fetchItem() {
    if (fetchItemExternal) {
      return fetchItemExternal()
    }
    isLoading.value = true

    // await new Promise(resolve => { setTimeout(() => resolve(), 3000) })

    let newValue = await repository.getOne(itemId.value)
    newValue = newValue.data
    // newValue = ("data" in newValue) ? newValue.data : newValue
    if (transformer) {
      newValue = transformer.transformFromApi(newValue)
    }

    item.value = newValue
    fetchedItem.value = _.cloneDeep(newValue)

    await nextTick()
    isLoading.value = false
  }

  async function saveItem() {
    // form.submit()
    isLoading.value = true

    let newItem = item.value

    if (transformer) {
      newItem = transformer.transformToApi(newItem)
    }

    // Give it the option for outside manipulation

    let response = null
    // let newItemId = newItem.id
    let newItemId = itemId.value || newItem.id
    if (newItemId) {
      response = await repository.update(newItemId, newItem)
    } else {
      response = await repository.insert(newItem)
    }

    if (ResponseUtils.isSuccess(response)) {
      UIUtils.showToastSuccess('Success')
      let responseId = _.get(response, 'data.data.id')
      itemId.value = _.get(response, 'data.data.id')
      onEvent ? onEvent('onPostSave', response) : null
      isLoading.value = false
      await navigateTo(`${routeForm}/${responseId}`)
    } else {
      isLoading.value = false
      // let errorMessage = _.get(response, 'data.message')
      // UIUtils.showToastError(`Unexpected error. ${errorMessage}`)
    }

    return response
  }

  const onDelete = async () => {
    let result = await UIUtils.showDeleteConfirmation('Delete confirmation', 'Are you sure you want to delete this?')
    if (result) {
      let response = await repository.delete(itemId.value)
      if (ResponseUtils.isSuccess(response)) {
        onEvent ? onEvent('onPostDelete', response) : null
        await navigateTo(routeList)
        UIUtils.showToastSuccess(`Deleted successfully.`, 1000)
      }
    }
  }

  const onNew = async () => {
    if (itemId.value) {
      await navigateTo(routeForm)
      return
    }

    // We are in the process of adding a new transaction, clear all fields
    resetFields()
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
    await initItem()
  })

  // ----- Loading indicators -----

  UIUtils.showLoadingWhen(isLoading)

  // -----------------------------

  return {
    itemId,
    item,
    fetchedItem,
    isEmpty,
    title,
    addButtonText,
    isLoading,
    onClickBack,
    onNew,
    saveItem,
    onDelete,
    onValidationError,
    formName,
  }
}
