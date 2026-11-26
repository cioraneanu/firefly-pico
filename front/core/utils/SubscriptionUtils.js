import { get, sortBy } from 'lodash-es'
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns'

// Kept free of `~/` imports so it can be checked with plain node

export const subscriptionRepeatFreq = {
  weekly: { code: 'weekly', perMonth: 52 / 12 },
  monthly: { code: 'monthly', perMonth: 1 },
  quarterly: { code: 'quarterly', perMonth: 1 / 3 },
  halfYear: { code: 'half-year', perMonth: 1 / 6 },
  yearly: { code: 'yearly', perMonth: 1 / 12 },
}

export const subscriptionState = { paid: 'paid', due: 'due', missed: 'missed' }

// Dates read back from localStorage are ISO strings
const toDate = (date) => (date ? new Date(date) : null)

export function getAverageAmount(subscription) {
  const amountMin = parseFloat(get(subscription, 'attributes.amount_min')) || 0
  const amountMax = parseFloat(get(subscription, 'attributes.amount_max')) || 0
  return (amountMin + amountMax) / 2
}

export function getMonthlyCost(subscription) {
  const repeatFreq = Object.values(subscriptionRepeatFreq).find((item) => item.code === get(subscription, 'attributes.repeat_freq'))
  const skip = parseInt(get(subscription, 'attributes.skip')) || 0
  return (getAverageAmount(subscription) * (repeatFreq?.perMonth ?? 0)) / (skip + 1)
}

// One row per subscription for a month: Firefly's expected dates vs the payments it found (not matched date by date)
export function getMonthStatus(subscription, today) {
  const payDates = (get(subscription, 'attributes.pay_dates') ?? []).map(toDate)
  const expected = payDates.length
  const paid = (get(subscription, 'attributes.paid_dates') ?? []).length
  if (!expected && !paid) {
    return null
  }
  if (!expected) {
    return { state: subscriptionState.paid, expected, paid, nextDate: toDate(get(subscription, 'attributes.next_expected_match')), isOffSchedule: true }
  }

  // A date passes once its day is over: due today and unpaid is still Due
  const passed = payDates.filter((date) => isBefore(startOfDay(date), startOfDay(today))).length
  const state = paid < passed ? subscriptionState.missed : paid < expected ? subscriptionState.due : subscriptionState.paid
  return { state, expected, paid, nextDate: payDates[paid] ?? null, isOffSchedule: false }
}

export function getReminders(list, today, days = 30) {
  const start = startOfDay(today)
  const end = addDays(start, days)
  const reminders = list
    .filter((subscription) => get(subscription, 'attributes.active'))
    .flatMap((subscription) =>
      [
        { kind: 'end', date: toDate(get(subscription, 'attributes.end_date')) },
        { kind: 'extension', date: toDate(get(subscription, 'attributes.extension_date')) },
      ]
        .filter(({ date }) => date && !isBefore(startOfDay(date), start) && !isAfter(startOfDay(date), end))
        .map((reminder) => ({ subscription, ...reminder })),
    )
  return sortBy(reminders, (reminder) => reminder.date.getTime())
}
