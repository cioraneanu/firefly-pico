import BaseModel from '~/models/BaseModel'
import { capitalize, get } from 'lodash'
import { endOfMonth, endOfYear, isSameDay, isSameMonth, isSameYear, startOfMonth, startOfYear } from 'date-fns'

export default class BudgetLimit extends BaseModel {
  static getLimitInterval(budgetLimit) {
    let start = get(budgetLimit, 'attributes.start')
    let end = get(budgetLimit, 'attributes.end')
    // Daily
    if (isSameDay(start, end)) {
      return DateUtils.dateToUI(start)
    }

    // Monthly
    if (isSameDay(startOfMonth(start), start) && isSameDay(endOfMonth(end), end) && isSameMonth(start, end)) {
      return capitalize(DateUtils.dateToString(start, 'MMM yyyy'))
    }

    // Yearly
    if (isSameDay(startOfYear(start), start) && isSameDay(endOfYear(end), end) && isSameYear(start, end)) {
      return DateUtils.dateToString(start, 'yyyy')
    }

    return `${DateUtils.dateToUI(start)} - ${DateUtils.dateToUI(end)}`
  }
}
