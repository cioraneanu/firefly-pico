import { omit } from 'lodash-es'

export function useTransactionDialog() {
  const route = useRoute()
  const transactionId = computed(() => route.query.tx)

  const openTransaction = (id = 'new', query = {}) => navigateTo({ query: { ...route.query, tx: id, ...query } })
  const closeTransaction = () => navigateTo({ query: omit(route.query, ['tx', 'clone']) })

  return { transactionId, openTransaction, closeTransaction }
}
