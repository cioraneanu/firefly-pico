import _, { get } from 'lodash-es'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'
import DateUtils from '~/utils/DateUtils'
import Transaction from '~/models/Transaction.js'
import Account from '~/models/Account.js'
import Tag from '~/models/Tag.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { useTagStore } from '~/stores/tagStore'
import { useCurrencyStore } from '~/stores/currencyStore'

export default class RecurringTransactionTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    const accountStore = useAccountStore()
    const categoryStore = useCategoryStore()
    const budgetStore = useBudgetStore()
    const tagStore = useTagStore()
    const currencyStore = useCurrencyStore()

    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))
    item.attributes.type = Transaction.typesList.find((type) => type.fireflyCode === get(item, 'attributes.type'))
    item.attributes.first_date = DateUtils.autoToDate(get(item, 'attributes.first_date'))
    item.attributes.repeat_until = DateUtils.autoToDate(get(item, 'attributes.repeat_until'))

    if (item.attributes.repeat_until) {
      item.attributes.repetitionEndType = RecurringTransaction.repetitionEndTypes.untilDate
    } else if (get(item, 'attributes.nr_of_repetitions')) {
      item.attributes.repetitionEndType = RecurringTransaction.repetitionEndTypes.nrOfTimes
    } else {
      item.attributes.repetitionEndType = RecurringTransaction.repetitionEndTypes.forever
    }

    const repetition = get(item, 'attributes.repetitions.0')
    const repetitionType = RecurringTransaction.repetitionTypesList().find((type) => type.fireflyCode === get(repetition, 'type'))
    const moment = `${get(repetition, 'moment') ?? ''}`
    item.attributes.repetitionSkip = get(repetition, 'skip')
    item.attributes.repetitionWeekend = get(repetition, 'weekend')
    item.attributes.repetitionType = repetitionType
    item.attributes.repetitionWeekday = null
    item.attributes.repetitionDay = null
    item.attributes.repetitionWeek = null
    item.attributes.repetitionDate = null

    switch (get(repetitionType, 'fireflyCode')) {
      case RecurringTransaction.repetitionTypes.weekly.fireflyCode:
        item.attributes.repetitionWeekday = RecurringTransaction.weekdaysList().find((weekday) => weekday.fireflyCode === parseInt(moment))
        break
      case RecurringTransaction.repetitionTypes.monthly.fireflyCode:
        item.attributes.repetitionDay = moment
        break
      case RecurringTransaction.repetitionTypes.ndom.fireflyCode: {
        const [week, weekday] = moment.split(',')
        item.attributes.repetitionWeek = week
        item.attributes.repetitionWeekday = RecurringTransaction.weekdaysList().find((item) => item.fireflyCode === parseInt(weekday))
        break
      }
      case RecurringTransaction.repetitionTypes.yearly.fireflyCode:
        item.attributes.repetitionDate = DateUtils.autoToDate(moment)
        break
    }

    item.attributes.occurrences = (get(repetition, 'occurrences') ?? []).map((occurrence) => DateUtils.autoToDate(occurrence)).sort((a, b) => a - b)

    const transaction = get(item, 'attributes.transactions.0')
    item.attributes.transactionId = get(transaction, 'id')
    item.attributes.currency = currencyStore.currencyDictionary[get(transaction, 'currency_id')]
    item.attributes.currencyForeign = currencyStore.currencyDictionary[get(transaction, 'foreign_currency_id')]
    item.attributes.amount = Transaction.formatAmountForCurrency(get(transaction, 'amount'), item.attributes.currency) ?? get(transaction, 'amount')
    item.attributes.amountForeign = Transaction.formatAmountForCurrency(get(transaction, 'foreign_amount'), item.attributes.currencyForeign) ?? get(transaction, 'foreign_amount')
    item.attributes.description = get(transaction, 'description')
    item.attributes.accountSource = accountStore.accountDictionary[get(transaction, 'source_id')]
    item.attributes.accountDestination = accountStore.accountDictionary[get(transaction, 'destination_id')]
    item.attributes.category = categoryStore.categoryDictionary[get(transaction, 'category_id')]
    item.attributes.budget = budgetStore.budgetDictionary[get(transaction, 'budget_id')]
    item.attributes.tags = (get(transaction, 'tags') ?? []).map((tagName) => tagStore.tagDictionaryByName[LanguageUtils.removeAccentsAndLowerCase(tagName)]).filter(Boolean)

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')

    // The "moment" format Firefly expects depends on the repetition type:
    //   daily   -> none (must be empty)
    //   weekly  -> weekday number 1-7
    //   monthly -> day of month 1-31
    //   ndom    -> "<week 1-5>,<weekday 1-7>"
    //   yearly  -> a "Y-m-d" date
    const repetitionTypeCode = get(data, 'repetitionType.fireflyCode')

    let moment = ''
    switch (repetitionTypeCode) {
      case RecurringTransaction.repetitionTypes.weekly.fireflyCode:
        moment = `${get(data, 'repetitionWeekday.fireflyCode') ?? ''}`
        break
      case RecurringTransaction.repetitionTypes.monthly.fireflyCode:
        moment = `${get(data, 'repetitionDay') ?? ''}`
        break
      case RecurringTransaction.repetitionTypes.ndom.fireflyCode:
        moment = `${get(data, 'repetitionWeek') ?? ''},${get(data, 'repetitionWeekday.fireflyCode') ?? ''}`
        break
      case RecurringTransaction.repetitionTypes.yearly.fireflyCode:
        moment = DateUtils.dateToString(get(data, 'repetitionDate')) ?? ''
        break
      // daily has no moment
    }

    let repetition = {
      type: repetitionTypeCode,
      skip: get(data, 'repetitionSkip') ?? 0,
      weekend: get(data, 'repetitionWeekend') ?? 1,
    }
    repetition.moment = moment
    const isUpdate = Boolean(get(item, 'id'))

    const accountSource = get(data, 'accountSource')
    const accountDestination = get(data, 'accountDestination')
    const typeCode = get(data, 'type.fireflyCode')
    const isIncomeFromLiability = typeCode === Transaction.types.income.fireflyCode && get(Account.getType(accountSource), 'fireflyCode') === Account.types.liability.fireflyCode
    const amountAccount = typeCode === Transaction.types.income.fireflyCode && !isIncomeFromLiability ? accountDestination : accountSource
    const currencyId = get(Account.getCurrency(amountAccount), 'id')
    const categoryId = get(data, 'category.id')
    const budgetId = get(data, 'budget.id')

    let transaction = {
      description: get(data, 'description') || get(data, 'title', ''),
      amount: get(data, 'amount'),
    }
    if (accountSource || !isUpdate) {
      transaction.source_id = accountSource?.id ?? null
    }
    if (accountDestination || !isUpdate) {
      transaction.destination_id = accountDestination?.id ?? null
    }

    if (categoryId || isUpdate) {
      transaction.category_id = categoryId ?? null
    }
    if (budgetId || isUpdate) {
      transaction.budget_id = budgetId ?? null
    }

    let tags = (get(data, 'tags') ?? []).map((tag) => Tag.getDisplayNameEllipsized(tag))
    transaction.tags = tags.length > 0 ? tags : null

    if (currencyId) {
      transaction.currency_id = currencyId
    }
    const foreignAmount = get(data, 'amountForeign')
    const foreignCurrencyId = get(data, 'currencyForeign.id')
    if (parseFloat(foreignAmount) > 0 && foreignCurrencyId) {
      transaction.foreign_amount = foreignAmount
      transaction.foreign_currency_id = foreignCurrencyId
    } else if (isUpdate) {
      transaction.foreign_amount = null
      transaction.foreign_currency_id = null
    }
    let transactionId = get(data, 'transactionId')
    if (transactionId) {
      transaction.id = transactionId
    }

    let result = {
      type: typeCode,
      title: get(data, 'title', ''),
      icon: get(data, 'icon.icon'),
      first_date: DateUtils.dateToString(get(data, 'first_date')),
      apply_rules: true,
      active: get(data, 'active') ?? true,
      notes: get(data, 'notes'),
      transactions: [transaction],
    }

    // Firefly's API *update* validation for "repetitions.*.moment" adds a `numeric`
    // (and `max:10`) rule that its *create* validation does not. That rule rejects
    // every non-numeric moment Firefly itself produces - daily (empty), ndom ("2,3"),
    // yearly (a date) and even monthly days above 10. The edit form keeps recurrence
    // timing read-only, and Firefly leaves the existing repetition untouched when the
    // "repetitions" key is absent, so we only send it on create.
    if (!isUpdate) {
      result.repetitions = [repetition]
    }

    // Firefly III rejects recurrences having both "repeat_until" and "nr_of_repetitions".
    // The unused field is explicitly nulled so switching the end mode clears the previous value.
    const repetitionEndCode = get(data, 'repetitionEndType.code')
    if (repetitionEndCode === RecurringTransaction.repetitionEndTypes.untilDate.code) {
      result.repeat_until = DateUtils.dateToString(get(data, 'repeat_until'))
      result.nr_of_repetitions = null
    } else if (repetitionEndCode === RecurringTransaction.repetitionEndTypes.nrOfTimes.code) {
      result.nr_of_repetitions = parseInt(get(data, 'nr_of_repetitions'))
      result.repeat_until = null
    } else {
      result.repeat_until = null
      result.nr_of_repetitions = null
    }

    return result
  }
}
