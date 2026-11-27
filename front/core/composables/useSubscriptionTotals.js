import Subscription from '~/core/models/Subscription'
import Currency from '~/core/models/Currency'
import { convertCurrency } from '~/core/utils/CurrencyUtils'
import { withoutDeleted } from '~/core/utils/DeleteUtils'

// Cost of the active subscriptions, converted into the dashboard currency like every dashboard card
export function useSubscriptionTotals() {
  const subscriptionStore = useSubscriptionStore()
  const dashboardStore = useDashboardStore()

  // Without an exchange rate the amount can't be converted: leave it out instead of turning every total into NaN
  const toDashboardCurrency = (amount, currencyCode) => {
    const converted = currencyCode === dashboardStore.dashboardCurrencyCode ? amount : convertCurrency(amount, currencyCode, dashboardStore.dashboardCurrencyCode)
    return Number.isFinite(converted) ? converted : 0
  }

  const monthly = computed(() =>
    withoutDeleted(subscriptionStore.subscriptionList)
      .filter((subscription) => Subscription.isActive(subscription))
      .reduce((sum, subscription) => sum + toDashboardCurrency(Subscription.getMonthlyCost(subscription), Subscription.getCurrencyCode(subscription)), 0),
  )
  const yearly = computed(() => monthly.value * 12)
  const currencySymbol = computed(() => Currency.getSymbol(dashboardStore.dashboardCurrency))

  return { monthly, yearly, currencySymbol, toDashboardCurrency }
}
