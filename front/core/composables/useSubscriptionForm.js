import RouteConstants from '~/core/constants/RouteConstants'
import Subscription from '~/core/models/Subscription'
import SubscriptionTransformer from '~/core/transformers/SubscriptionTransformer'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils'
import { generateChildren } from '~/core/utils/VueUtils'

export function useSubscriptionForm(options = {}) {
  const subscriptionStore = useSubscriptionStore()
  const { t } = useI18n()

  const form = useEntityForm({
    list: toRef(subscriptionStore, 'subscriptionList'),
    dictionary: toRef(subscriptionStore, 'subscriptionDictionary'),
    transformer: SubscriptionTransformer,
    routeList: RouteConstants.ROUTE_SUBSCRIPTION_LIST,
    routeForm: RouteConstants.ROUTE_SUBSCRIPTION_ID,
    model: new Subscription(),
    resetFields: () => (fields.name.value = ''),
    ...options,
    // A saved subscription comes back without this month's expected/paid dates: refetch them
    onEvent: (event, payload) => {
      event === useFormEvent.postSave && subscriptionStore.fetchSubscriptions()
      options.onEvent?.(event, payload)
    },
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'amountMin', parentKey: 'attributes.amount_min' },
    { computed: 'amountMax', parentKey: 'attributes.amount_max' },
    { computed: 'currency', parentKey: 'attributes.currency' },
    { computed: 'date', parentKey: 'attributes.date' },
    { computed: 'repeatFreq', parentKey: 'attributes.repeat_freq' },
    { computed: 'skip', parentKey: 'attributes.skip' },
    { computed: 'endDate', parentKey: 'attributes.end_date' },
    { computed: 'extensionDate', parentKey: 'attributes.extension_date' },
    { computed: 'active', parentKey: 'attributes.active' },
    { computed: 'notes', parentKey: 'attributes.notes' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value)))

  const amountMaxRule = { validator: (value) => Number(value) >= Number(fields.amountMin.value), message: t('subscription_page.amount_max_too_low') }
  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.subscription.toUrl(form.item.value)}`)

  return {
    ...form,
    ...fields,
    amountMaxRule,
    transactionsRoute,
  }
}
