import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import AccountRepository from '~/core/repository/AccountRepository'
import AccountTransformer from '~/core/transformers/AccountTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useAccountForm(options = {}) {
  const accountStore = useAccountStore()
  const profileStore = useProfileStore()

  const onEvent = (event, payload) => {
    if (event === useFormEvent.postSave) form.item.value = accountStore.accountList[0]
    options.onEvent?.(event, payload)
  }

  const form = useEntityForm({
    list: toRef(accountStore, 'accountList'),
    dictionary: toRef(accountStore, 'accountDictionary'),
    transformer: AccountTransformer,
    routeList: RouteConstants.ROUTE_ACCOUNT_LIST,
    routeForm: RouteConstants.ROUTE_ACCOUNT_ID,
    model: new Account(),
    ...options,
    onEvent,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'group', parentKey: 'attributes.group' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'type', parentKey: 'attributes.type' },
    { computed: 'role', parentKey: 'attributes.account_role' },
    { computed: 'liabilityType', parentKey: 'attributes.liability_type' },
    { computed: 'liabilityDirection', parentKey: 'attributes.liability_direction' },
    { computed: 'currency', parentKey: 'attributes.currency' },
    { computed: 'includeNetWorth', parentKey: 'attributes.include_net_worth' },
    { computed: 'isDashboardVisible', parentKey: 'attributes.is_dashboard_visible' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value, profileStore.lowerCaseAccountName)))

  const isRoleVisible = computed(() => get(fields.type.value, 'fireflyCode') === Account.types.asset.fireflyCode)
  const isLiability = computed(() => get(fields.type.value, 'fireflyCode') === Account.types.liability.fireflyCode)
  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.account.toUrl([form.item.value])}`)
  const getGroups = (text) => new AccountRepository().getGroups(text)

  return { ...form, ...fields, isRoleVisible, isLiability, transactionsRoute, getGroups }
}
