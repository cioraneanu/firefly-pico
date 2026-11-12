import { get, isEqual, maxBy } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'
import Transaction from '~/core/models/Transaction'
import TransactionRepository from '~/core/repository/TransactionRepository'
import { convertCurrency } from '~/core/utils/CurrencyUtils'
import { filterBagHasValues, getFiltersFromURL, saveToUrl } from '~/core/utils/FilterUtils'

export function useTransactionList() {
  const currencyStore = useCurrencyStore()
  const transactionRepository = new TransactionRepository()
  const filterDefinitions = Object.values(TransactionFilterUtils.filters)

  const getAll = ({ page, pageSize }) =>
    filtersBackendList.value.length === 0
      ? transactionRepository.getAll({ page, pageSize })
      : transactionRepository.searchTransaction({ page, pageSize, filters: [{ field: 'query', value: filtersBackendList.value.join(' ') }] })

  const listState = useList({
    routeList: RouteConstants.ROUTE_TRANSACTION_LIST,
    routeForm: RouteConstants.ROUTE_TRANSACTION_ID,
    model: new Transaction(),
    getAll,
  })

  const { filters, filtersBackendList, filtersDisplayList, activeFilters, activeFiltersCount } = useListFilters({ filterDefinitions })

  const showSearchTotal = ref(false)
  const searchTotal = ref(null)
  const searchTotalCurrency = ref(null)
  const isComputingSearchTotal = ref(false)

  watch(filtersBackendList, (newValue, oldValue) => {
    if (isEqual(newValue, oldValue)) return
    searchTotal.value = null
    listState.onRefresh()
  })

  watch(filters, (newValue, oldValue) => !isEqual(newValue, oldValue) && saveToUrl(activeFilters.value))
  // A link to the open list with ?description= (the desktop ⌘K search) still applies it
  const route = useRoute()
  watch(
    () => route.query.description,
    (description) => description && description !== filters.value.description && (filters.value = { ...filters.value, description }),
  )

  const onClearFilters = () => (filters.value = {})

  const onToggleSearchTotal = () => {
    showSearchTotal.value = !showSearchTotal.value
    if (showSearchTotal.value && !get(currencyStore.exchangeRates, 'rates')) currencyStore.fetchExchangeRate()
  }

  const searchTotalFormatted = computed(() => {
    const totals = get(searchTotal.value, 'totals') ?? []
    const targetCode = Currency.getCode(searchTotalCurrency.value)
    if (totals.length === 0 || !targetCode) return null
    const amount = totals.reduce((result, total) => result + (total.currency_code === targetCode ? total.amount : convertCurrency(total.amount, total.currency_code, targetCode)), 0)
    return isNaN(amount) ? null : Currency.formatAmountWithSymbol(amount, get(searchTotalCurrency.value, 'id'))
  })

  const onComputeSearchTotal = async () => {
    if (isComputingSearchTotal.value) return
    isComputingSearchTotal.value = true
    const response = await transactionRepository.searchTransactionsTotal({ filters: [{ field: 'query', value: filtersBackendList.value.join(' ') }] })
    isComputingSearchTotal.value = false
    if (!ResponseUtils.isSuccess(response)) return

    searchTotal.value = get(response, 'data.data')
    if (!searchTotalCurrency.value) {
      const dominantTotal = maxBy(get(searchTotal.value, 'totals') ?? [], 'count')
      searchTotalCurrency.value = currencyStore.currenciesList.find((currency) => Currency.getCode(currency) === dominantTotal?.currency_code) ?? currencyStore.defaultCurrency
    }
  }

  onMounted(() => {
    filters.value = getFiltersFromURL(filterDefinitions)
    if (!filterBagHasValues(filters.value)) filters.value = TransactionFilterUtils.getPredefinedFilters()
  })

  return {
    ...listState,
    filters,
    filtersDisplayList,
    activeFilters,
    activeFiltersCount,
    onClearFilters,
    showSearchTotal,
    searchTotalCurrency,
    isComputingSearchTotal,
    searchTotalFormatted,
    onToggleSearchTotal,
    onComputeSearchTotal,
  }
}
