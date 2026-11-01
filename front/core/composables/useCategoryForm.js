import { cloneDeep, get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Category from '~/core/models/Category'
import CategoryTransformer from '~/core/transformers/CategoryTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useCategoryForm(options = {}) {
  const categoryStore = useCategoryStore()
  const profileStore = useProfileStore()

  const onEvent = (event, payload) => {
    const others = categoryStore.categoryList.filter((item) => item.id !== form.itemId.value)
    if (event === useFormEvent.postSave) categoryStore.categoryList = [CategoryTransformer.transformFromApi(get(payload, 'data.data')), ...others]
    if (event === useFormEvent.postDelete) categoryStore.categoryList = others
    options.onEvent?.(event, payload)
  }

  const form = useForm({
    routeList: RouteConstants.ROUTE_CATEGORY_LIST,
    routeForm: RouteConstants.ROUTE_CATEGORY_ID,
    model: new Category(),
    resetFields: () => (fields.name.value = ''),
    fetchItem: () => (form.item.value = cloneDeep(categoryStore.categoryDictionary[useRoute().params.id])),
    ...options,
    onEvent,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'icon', parentKey: 'attributes.icon' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value, profileStore.lowerCaseCategoryName)))

  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.category.toUrl(form.item.value)}`)

  return { ...form, ...fields, transactionsRoute }
}
