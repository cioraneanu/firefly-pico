import RouteConstants from '~/core/constants/RouteConstants'
import Category from '~/core/models/Category'
import CategoryTransformer from '~/core/transformers/CategoryTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useCategoryForm(options = {}) {
  const categoryStore = useCategoryStore()
  const profileStore = useProfileStore()

  const form = useEntityForm({
    list: toRef(categoryStore, 'categoryList'),
    dictionary: toRef(categoryStore, 'categoryDictionary'),
    transformer: CategoryTransformer,
    routeList: RouteConstants.ROUTE_CATEGORY_LIST,
    routeForm: RouteConstants.ROUTE_CATEGORY_ID,
    model: new Category(),
    resetFields: () => (fields.name.value = ''),
    ...options,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'icon', parentKey: 'attributes.icon' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value, profileStore.lowerCaseCategoryName)))

  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.category.toUrl(form.item.value)}`)

  return { ...form, ...fields, transactionsRoute }
}
