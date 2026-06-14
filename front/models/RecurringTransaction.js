import BaseModel from '~/models/BaseModel'
import { get } from 'lodash-es'
import { addDays, startOfDay } from 'date-fns'
import DateUtils from '~/utils/DateUtils'
import Transaction from '~/models/Transaction.js'
import RecurringTransactionTransformer from '~/transformers/RecurringTransactionTransformer.js'
import RecurringTransactionRepository from '~/repository/RecurringTransactionRepository.js'

export default class RecurringTransaction extends BaseModel {
  getTransformer() {
    return RecurringTransactionTransformer
  }

  getRepository() {
    return new RecurringTransactionRepository()
  }

  getEmpty() {
    return {
      attributes: {
        title: '',
        icon: null,
        type: Transaction.types.expense,
        amount: '',
        description: '',
        accountSource: null,
        accountDestination: null,
        category: null,
        budget: null,
        tags: [],
        repetitionType: RecurringTransaction.repetitionTypes.monthly,
        repetitionWeekday: null,
        repetitionDay: null,
        repetitionWeek: null,
        repetitionDate: null,
        // Firefly III requires the first date of a new recurrence to be in the future
        first_date: startOfDay(addDays(new Date(), 1)),
        repetitionEndType: RecurringTransaction.repetitionEndTypes.forever,
        repeat_until: null,
        nr_of_repetitions: null,
        active: true,
        notes: '',
      },
    }
  }

  // ------------

  getFake(id) {
    return {}
  }

  // --------

  static get repetitionTypes() {
    return {
      daily: {
        name: 'Daily',
        fireflyCode: 'daily',
      },
      weekly: {
        name: 'Weekly',
        fireflyCode: 'weekly',
      },
      monthly: {
        name: 'Monthly',
        fireflyCode: 'monthly',
      },
      ndom: {
        name: 'Monthly (nth weekday)',
        fireflyCode: 'ndom',
      },
      yearly: {
        name: 'Yearly',
        fireflyCode: 'yearly',
      },
    }
  }

  static repetitionTypesList() {
    return Object.values(this.repetitionTypes)
  }

  static get repetitionEndTypes() {
    return {
      forever: {
        name: 'Repeat forever',
        code: 'forever',
      },
      untilDate: {
        name: 'Repeat until date',
        code: 'until_date',
      },
      nrOfTimes: {
        name: 'Repeat a number of times',
        code: 'nr_of_times',
      },
    }
  }

  static repetitionEndTypesList() {
    return Object.values(this.repetitionEndTypes)
  }

  static get weekdays() {
    return {
      monday: { name: 'Monday', fireflyCode: 1 },
      tuesday: { name: 'Tuesday', fireflyCode: 2 },
      wednesday: { name: 'Wednesday', fireflyCode: 3 },
      thursday: { name: 'Thursday', fireflyCode: 4 },
      friday: { name: 'Friday', fireflyCode: 5 },
      saturday: { name: 'Saturday', fireflyCode: 6 },
      sunday: { name: 'Sunday', fireflyCode: 7 },
    }
  }

  static weekdaysList() {
    return Object.values(this.weekdays)
  }

  // --------

  static getDisplayName(recurringTransaction) {
    return get(recurringTransaction, 'attributes.title')
  }

  static getType(recurringTransaction) {
    return get(recurringTransaction, 'attributes.type')
  }

  static getAmount(recurringTransaction) {
    return parseFloat(get(recurringTransaction, 'attributes.amount') ?? 0)
  }

  static getAmountFormatted(recurringTransaction) {
    return Transaction.formatAmountForCurrency(get(recurringTransaction, 'attributes.amount'), get(recurringTransaction, 'attributes.currency')) ?? this.getAmount(recurringTransaction)
  }

  static getRepetitionType(recurringTransaction) {
    return get(recurringTransaction, 'attributes.repetitionType')
  }

  static getOccurrences(recurringTransaction) {
    // Dates get serialized to strings in localStorage, so normalize them back
    return (get(recurringTransaction, 'attributes.occurrences') ?? []).map((occurrence) => DateUtils.autoToDate(occurrence))
  }

  static getNextOccurrence(recurringTransaction) {
    return this.getOccurrences(recurringTransaction)[0]
  }

  static isActive(recurringTransaction) {
    return get(recurringTransaction, 'attributes.active')
  }

  // --------

  static getCurrencySymbol(recurringTransaction) {
    const currencyStore = useCurrencyStore()
    return get(recurringTransaction, 'attributes.currency.attributes.symbol', get(currencyStore.defaultCurrency, 'attributes.symbol'))
  }
}
