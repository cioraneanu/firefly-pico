import { get, isEqual } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Transaction from '~/core/models/Transaction'
import TransactionTemplate from '~/core/models/TransactionTemplate'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTemplateTransformer from '~/core/transformers/TransactionTemplateTransformer'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'
import { generateChildren } from '~/core/utils/VueUtils'

export function useTemplateForm(options = {}) {
  const templateStore = useTemplateStore()
  const route = useRoute()

  const form = useEntityForm({
    list: toRef(templateStore, 'transactionTemplateList'),
    transformer: TransactionTemplateTransformer,
    routeList: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
    routeForm: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
    model: new TransactionTemplate(),
    ...options,
  })

  const fields = generateChildren(form.item, ['type', 'name', 'extra_names', 'amount', 'budget', 'subscription', 'description', 'notes', 'account_source', 'account_destination', 'category', 'tags'])

  const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(fields.type.value))
  const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(fields.type.value))

  onMounted(async () => {
    const transactionId = get(route.query, 'transaction_id')
    if (!transactionId) return

    const response = await new TransactionRepository().getOne(transactionId)
    const transaction = get(TransactionTransformer.transformFromApi(response.data), 'attributes.transactions.0')
    if (!transaction) return

    Object.assign(form.item.value, {
      amount: transaction.amount,
      name: transaction.description,
      type: transaction.type,
      description: transaction.description,
      notes: transaction.notes,
      account_source: transaction.accountSource,
      account_destination: transaction.accountDestination,
      category: transaction.category,
      tags: transaction.tags,
      budget: transaction.budget,
      subscription: transaction.subscription,
    })
  })

  // Subscriptions are paid by withdrawals only; a template without a type gets it from its accounts
  const isSubscriptionVisible = computed(() => useProfileStore().subscriptionsEnabled && (!fields.type.value || isEqual(fields.type.value, Transaction.types.expense)))
  watch(isSubscriptionVisible, (isVisible) => !isVisible && (fields.subscription.value = null))
  const isBudgetVisible = computed(() => useProfileStore().budgetsEnabled)

  return { ...form, ...fields, accountSourceAllowedTypes, accountDestinationAllowedTypes, isSubscriptionVisible, isBudgetVisible }
}
