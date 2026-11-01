import { isEqual } from 'lodash-es'
import { addDays, startOfDay, subYears } from 'date-fns'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import RecurringTransaction from '~/core/models/RecurringTransaction'
import Transaction from '~/core/models/Transaction'
import RecurringTransactionTransformer from '~/core/transformers/RecurringTransactionTransformer'
import { rule } from '~/core/utils/ValidationUtils'
import { generateChildren } from '~/core/utils/VueUtils'

export function useRecurringTransactionForm(options = {}) {
  const recurringTransactionStore = useRecurringTransactionStore()

  const form = useEntityForm({
    list: toRef(recurringTransactionStore, 'recurringTransactionList'),
    dictionary: toRef(recurringTransactionStore, 'recurringTransactionDictionary'),
    transformer: RecurringTransactionTransformer,
    routeList: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
    routeForm: RouteConstants.ROUTE_RECURRING_TRANSACTION_ID,
    model: new RecurringTransaction(),
    resetFields: () => (fields.title.value = ''),
    ...options,
  })

  const fields = generateChildren(form.item, [
    { computed: 'title', parentKey: 'attributes.title' },
    { computed: 'icon', parentKey: 'attributes.icon' },
    { computed: 'type', parentKey: 'attributes.type' },
    { computed: 'amount', parentKey: 'attributes.amount' },
    { computed: 'amountForeign', parentKey: 'attributes.amountForeign' },
    { computed: 'currencyForeign', parentKey: 'attributes.currencyForeign' },
    { computed: 'accountSource', parentKey: 'attributes.accountSource' },
    { computed: 'accountDestination', parentKey: 'attributes.accountDestination' },
    { computed: 'category', parentKey: 'attributes.category' },
    { computed: 'budget', parentKey: 'attributes.budget' },
    { computed: 'tags', parentKey: 'attributes.tags' },
    { computed: 'description', parentKey: 'attributes.description' },
    { computed: 'repetitionType', parentKey: 'attributes.repetitionType' },
    { computed: 'repetitionWeekday', parentKey: 'attributes.repetitionWeekday' },
    { computed: 'repetitionDay', parentKey: 'attributes.repetitionDay' },
    { computed: 'repetitionWeek', parentKey: 'attributes.repetitionWeek' },
    { computed: 'repetitionDate', parentKey: 'attributes.repetitionDate' },
    { computed: 'firstDate', parentKey: 'attributes.first_date' },
    { computed: 'repetitionEndType', parentKey: 'attributes.repetitionEndType' },
    { computed: 'repeatUntil', parentKey: 'attributes.repeat_until' },
    { computed: 'nrOfRepetitions', parentKey: 'attributes.nr_of_repetitions' },
    { computed: 'active', parentKey: 'attributes.active' },
    { computed: 'notes', parentKey: 'attributes.notes' },
  ])
  const { title, type, amountForeign, currencyForeign, accountSource, accountDestination, repetitionType, firstDate, repetitionEndType, repeatUntil, nrOfRepetitions } = fields
  const { itemId } = form

  const upcomingDates = computed(() => RecurringTransaction.getOccurrences(form.item.value).map((date) => DateUtils.dateToUI(date)))
  const transactionsRoute = computed(() => `${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.recurrence.toUrl(form.item.value)}`)

  const isRepetitionWeekly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.weekly))
  const isRepetitionMonthly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.monthly))
  const isRepetitionNdom = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.ndom))
  const isRepetitionYearly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.yearly))
  const isEndUntilDate = computed(() => isEqual(repetitionEndType.value, RecurringTransaction.repetitionEndTypes.untilDate))
  const isEndNrOfTimes = computed(() => isEqual(repetitionEndType.value, RecurringTransaction.repetitionEndTypes.nrOfTimes))

  const maxFireflyDate = new Date(2038, 0, 16)
  const firstDateMin = computed(() => (itemId.value ? subYears(new Date(), 5) : startOfDay(addDays(new Date(), 1))))
  const firstDateRules = computed(() => [rule.required(), ...(!itemId.value ? [rule.afterDate(new Date())] : [])])
  const repeatUntilRules = computed(() => [rule.required(), rule.afterDate(firstDate.value, true)])

  watch(repetitionEndType, () => {
    if (!isEndUntilDate.value) repeatUntil.value = null
    if (!isEndNrOfTimes.value) nrOfRepetitions.value = null
  })

  const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
  const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
  const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

  const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
  const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))
  const isIncomeFromLiability = computed(() => isTypeIncome.value && isEqual(Account.getType(accountSource.value), Account.types.liability))
  const amountCurrency = computed(() => Account.getCurrency(isTypeIncome.value && !isIncomeFromLiability.value ? accountDestination.value : accountSource.value))

  const isForeignAmountVisible = computed(() => {
    const sourceCurrency = Account.getCurrency(accountSource.value)
    const destinationCurrency = Account.getCurrency(accountDestination.value)
    const currencyAwareTypes = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode]
    const sourceType = Account.getType(accountSource.value)?.fireflyCode
    const destinationType = Account.getType(accountDestination.value)?.fireflyCode
    return Boolean(currencyAwareTypes.includes(sourceType) && currencyAwareTypes.includes(destinationType) && sourceCurrency && destinationCurrency && sourceCurrency.id !== destinationCurrency.id)
  })

  watch(type, (newValue, oldValue) => {
    if (itemId.value || !oldValue || isEqual(newValue, oldValue)) return
    const { source, destination } = Transaction.attemptAccountFixOnTypeChange(newValue, accountSource.value, accountDestination.value)
    accountSource.value = source
    accountDestination.value = destination
  })

  watch([accountSource, accountDestination], (_, [oldSource, oldDestination]) => {
    if (oldSource === undefined && oldDestination === undefined) return
    if (isForeignAmountVisible.value) {
      currencyForeign.value = Account.getCurrency(accountDestination.value)
      return
    }
    amountForeign.value = ''
    currencyForeign.value = null
  })

  const isAccountSourceRequired = computed(() => isTypeExpense.value || isTypeTransfer.value)
  const isAccountDestinationRequired = computed(() => isTypeIncome.value || isTypeTransfer.value)

  watch(title, (value) => (title.value = LanguageUtils.formatName(value)))

  return {
    ...form,
    ...fields,
    upcomingDates,
    transactionsRoute,
    isRepetitionWeekly,
    isRepetitionMonthly,
    isRepetitionNdom,
    isRepetitionYearly,
    isEndUntilDate,
    isEndNrOfTimes,
    maxFireflyDate,
    firstDateMin,
    firstDateRules,
    repeatUntilRules,
    accountSourceAllowedTypes,
    accountDestinationAllowedTypes,
    amountCurrency,
    isForeignAmountVisible,
    isAccountSourceRequired,
    isAccountDestinationRequired,
  }
}
