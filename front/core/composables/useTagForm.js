import { cloneDeep, get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Tag from '~/core/models/Tag'
import TagRepository from '~/core/repository/TagRepository'
import TagTransformer from '~/core/transformers/TagTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useTagForm(options = {}) {
  const tagStore = useTagStore()
  const profileStore = useProfileStore()
  const { t } = useI18n()

  const fetchItem = () => {
    const tag = cloneDeep(tagStore.tagDictionaryById[useRoute().params.id])
    const parentId = get(tag, 'attributes.parent_id')
    if (parentId) tag.attributes.parentTag = tagStore.tagDictionaryById[parentId]
    form.item.value = tag
  }

  const onEvent = (event, payload) => {
    const [saved, ...others] = tagStore.tagList
    if (event === useFormEvent.postSave && saved.attributes.is_todo) others.forEach((tag) => (tag.attributes.is_todo = false))
    options.onEvent?.(event, payload)
  }

  const form = useEntityForm({
    list: toRef(tagStore, 'tagList'),
    transformer: TagTransformer,
    routeList: RouteConstants.ROUTE_TAG_LIST,
    routeForm: RouteConstants.ROUTE_TAG_ID,
    model: new Tag(),
    resetFields: () => (fields.tag.value = ''),
    fetchItem,
    ...options,
    onEvent,
  })

  const fields = generateChildren(form.item, [
    { computed: 'tag', parentKey: 'attributes.tag' },
    { computed: 'description', parentKey: 'attributes.description' },
    { computed: 'date', parentKey: 'attributes.date' },
    { computed: 'parentTag', parentKey: 'attributes.parentTag' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'isTodo', parentKey: 'attributes.is_todo' },
  ])

  watch(fields.tag, (value) => (fields.tag.value = LanguageUtils.formatName(value, profileStore.lowerCaseTagName)))

  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.tag.toUrl(form.item.value)}`)

  const isComputingTotal = ref(false)
  const totalFormatted = computed(() => Tag.getTotalFormatted(form.item.value))
  const totalLabel = computed(() => (totalFormatted.value ? `${t('tag_page.total')}: ${totalFormatted.value}` : t('tag_page.compute_total')))

  const computeTotal = async () => {
    if (isComputingTotal.value) return
    isComputingTotal.value = true
    const response = await new TagRepository().computeTotal(form.itemId.value)
    isComputingTotal.value = false
    if (!ResponseUtils.isSuccess(response)) return

    const total = { total_amount: get(response, 'data.data.total_amount'), total_currency_id: get(response, 'data.data.total_currency_id') }
    Object.assign(form.item.value.attributes, total)
    Object.assign(tagStore.tagDictionaryById[form.itemId.value]?.attributes ?? {}, total)
    UIUtils.showToastSuccess(t('tag_page.total_success'))
  }

  return { ...form, ...fields, transactionsRoute, isComputingTotal, totalFormatted, totalLabel, computeTotal }
}
