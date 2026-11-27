import BaseModel from '~/core/models/BaseModel'
import { get } from 'lodash-es'
import DateUtils from '~/core/utils/DateUtils'
import SubscriptionTransformer from '~/core/transformers/SubscriptionTransformer.js'
import SubscriptionRepository from '~/core/repository/SubscriptionRepository.js'
import { getAverageAmount, getMonthlyCost, getMonthStatus, subscriptionRepeatFreq } from '~/core/utils/SubscriptionUtils.js'

export default class Subscription extends BaseModel {
  getTransformer() {
    return SubscriptionTransformer
  }

  getRepository() {
    return new SubscriptionRepository()
  }

  getEmpty() {
    return {
      attributes: {
        name: '',
        icon: null,
        amount_min: null,
        amount_max: null,
        currency: useCurrencyStore().defaultCurrency,
        date: new Date(),
        repeat_freq: subscriptionRepeatFreq.monthly.code,
        skip: 0,
        end_date: null,
        extension_date: null,
        active: true,
        notes: '',
      },
    }
  }

  // --------

  static getDisplayName(subscription) {
    return get(subscription, 'attributes.name')
  }

  static isActive(subscription) {
    return !!get(subscription, 'attributes.active')
  }

  static getRepeatFreqList() {
    return Object.values(subscriptionRepeatFreq).map(({ code }) => ({ code, t: `subscription_page.repeat.${code}` }))
  }

  static getRepeatFreq(subscription) {
    return this.getRepeatFreqList().find((item) => item.code === get(subscription, 'attributes.repeat_freq'))
  }

  static getNextExpectedDate(subscription) {
    return DateUtils.autoToDate(get(subscription, 'attributes.next_expected_match'))
  }

  static getAverageAmount = getAverageAmount
  static getMonthlyCost = getMonthlyCost
  static getMonthStatus = getMonthStatus

  // --------

  static getCurrencyCode(subscription) {
    const currencyStore = useCurrencyStore()
    return get(subscription, 'attributes.currency.attributes.code', get(currencyStore.defaultCurrency, 'attributes.code'))
  }

  static getCurrencySymbol(subscription) {
    const currencyStore = useCurrencyStore()
    return get(subscription, 'attributes.currency.attributes.symbol', get(currencyStore.defaultCurrency, 'attributes.symbol'))
  }
}
