import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
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

  const fields = generateChildren(form.item, ['type', 'name', 'extra_names', 'amount', 'budget', 'description', 'notes', 'account_source', 'account_destination', 'category', 'tags'])

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
    })
  })

  return { ...form, ...fields, accountSourceAllowedTypes, accountDestinationAllowedTypes }
}
