import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Budget from '~/core/models/Budget'
import BudgetLimit from '~/core/models/BudgetLimit'
import BudgetTransformer from '~/core/transformers/BudgetTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useBudgetForm(options = {}) {
  const budgetStore = useBudgetStore()

  const form = useEntityForm({
    list: toRef(budgetStore, 'budgetList'),
    dictionary: toRef(budgetStore, 'budgetDictionary'),
    transformer: BudgetTransformer,
    routeList: RouteConstants.ROUTE_BUDGET_LIST,
    routeForm: RouteConstants.ROUTE_BUDGET_ID,
    model: new Budget(),
    resetFields: () => (fields.name.value = ''),
    ...options,
  })

  const fields = generateChildren(form.item, [
    { computed: 'name', parentKey: 'attributes.name' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'type', parentKey: 'attributes.auto_budget_type' },
    { computed: 'period', parentKey: 'attributes.auto_budget_period' },
    { computed: 'currency', parentKey: 'attributes.currency' },
    { computed: 'amount', parentKey: 'attributes.amount' },
    { computed: 'active', parentKey: 'attributes.active' },
  ])

  watch(fields.name, (value) => (fields.name.value = LanguageUtils.formatName(value)))

  const isPeriodVisible = computed(() => get(fields.type.value, 'fireflyCode') !== Budget.types.manual.fireflyCode)
  const limit = computed(() => Budget.getLimit(form.item.value))
  const limitPercent = computed(() => get(limit.value, 'attributes.percent', 0).toFixed(2))
  const limitSpent = computed(() => Math.abs(get(limit.value, 'attributes.spent', 0)))
  const limitAmount = computed(() => get(limit.value, 'attributes.amount') ?? 0)
  const limitInterval = computed(() => BudgetLimit.getLimitInterval(limit.value))
  const currencySymbol = computed(() => Budget.getCurrencySymbol(form.item.value))
  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.budget.toUrl(form.item.value)}`)

  return { ...form, ...fields, isPeriodVisible, limitPercent, limitSpent, limitAmount, limitInterval, currencySymbol, transactionsRoute }
}
