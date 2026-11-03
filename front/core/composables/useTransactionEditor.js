import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import TransactionTransformer from '~/core/transformers/TransactionTransformer'

export function useTransactionEditor(options = {}) {
  const route = useRoute()
  const { t } = useI18n()

  const form = useForm({
    routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
    routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
    model: new Transaction(),
    ...options,
  })

  const cloneId = computed(() => get(route.query, 'transaction_id'))
  const isCloning = computed(() => !!cloneId.value)
  const isSplitTransaction = computed(() => Transaction.isSplitPayment(form.item.value))
  const cloneRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_ID}?transaction_id=${form.itemId.value}`)
  const templateRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}?transaction_id=${form.itemId.value}`)

  const title = computed(() => {
    if (isCloning.value) return t('transaction.title_clone_transaction')
    if (isSplitTransaction.value) return t('transaction.title_split_details')
    return form.itemId.value ? t('transaction.title_edit_transaction') : t('transaction.title_add_transaction')
  })

  onMounted(async () => {
    if (!cloneId.value) return
    const response = await new TransactionRepository().getOne(cloneId.value)
    const clone = TransactionTransformer.transformFromApi(response.data)
    delete clone.id
    form.item.value = clone
  })

  return { ...form, isCloning, isSplitTransaction, cloneRoute, templateRoute, title }
}
