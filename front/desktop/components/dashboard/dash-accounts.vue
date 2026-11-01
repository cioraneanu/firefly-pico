<template>
  <d-card :title="$t('dashboard.account_total')" :description="hasManyCurrencies ? `~${mask(formatNumberForDashboard(dashboardStore.dashboardAccountsEstimatedTotal))} ${currencyCode}` : null">
    <div class="grid grid-cols-3 gap-2">
      <d-dash-tile
        v-for="account in dashboardStore.dashboardAccountsVisible"
        :key="account.id"
        :label="Account.getDisplayName(account)"
        :value="mask(`${formatNumberForDashboard(Account.getBalance(account))} ${Account.getCurrencySymbol(account)}`)"
        :tone="balance(account) < 0 ? 'expense' : null"
        :meter="profileStore.dashboard.showAccountAmounts ? share(account) : 0"
        :hint="hint(account)"
        :icon="Account.getIcon(account) ?? IconCreditCard"
        :to="`${RouteConstants.ROUTE_TRANSACTION_LIST}?${TransactionFilterUtils.filters.account.toUrl([account])}`"
      />
    </div>
    <template #footer>
      <span class="text-xs text-dim">{{ $t('dashboard.accounts.by_currency') }}</span>
      <d-badge v-for="(total, code) in dashboardStore.dashboardAccountsTotalByCurrency" :key="code" variant="outline" class="tabular-nums"
        >{{ mask(formatNumberForDashboard(total)) }} {{ code }}</d-badge
      >
      <template v-if="Object.keys(dashboardStore.dashboardAccountsTotalByGroup).length">
        <span class="ml-2 text-xs text-dim">{{ $t('dashboard.accounts.by_group') }}</span>
        <d-badge v-for="(total, group) in dashboardStore.dashboardAccountsTotalByGroup" :key="group" variant="outline" class="tabular-nums"
          >{{ group }} · {{ mask(formatNumberForDashboard(total)) }} {{ currencyCode }}</d-badge
        >
      </template>
    </template>
  </d-card>
</template>

<script setup>
import { IconCreditCard } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Currency from '~/core/models/Currency'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()

const currencyCode = computed(() => Currency.getCode(dashboardStore.dashboardCurrency))
const hasManyCurrencies = computed(() => dashboardStore.dashboardAccountsCurrencyList.length > 1)
const mask = (value) => (profileStore.dashboard.showAccountAmounts ? value : '•••')
const balance = (account) => Number(Account.getBalance(account)) || 0

// Each account's share of the positive balances in its currency (debts: how much of them they owe)
const fundsByCurrency = computed(() =>
  dashboardStore.dashboardAccountsVisible.reduce((result, account) => {
    const code = Account.getCurrencyCode(account)
    result[code] = (result[code] ?? 0) + Math.max(balance(account), 0)
    return result
  }, {}),
)
const share = (account) => Math.min(Math.abs(balance(account)) / (fundsByCurrency.value[Account.getCurrencyCode(account)] || 1), 1) * 100

const hint = (account) => {
  if (!profileStore.dashboard.showAccountAmounts) return t('desktop.dashboard.amount_hidden')
  if (Account.hasVirtualBalance(account)) return `${t('account_page.available')}: ${formatNumberForDashboard(Account.getAvailableBalance(account))}`
  if (!Account.getIsIncludedInNetWorth(account)) return t('desktop.not_in_net_worth')
  const values = { percent: Math.round(share(account)), currency: Account.getCurrencyCode(account) }
  return balance(account) < 0 ? t('desktop.dashboard.owed_share', values) : t('desktop.dashboard.share_of_funds', values)
}
</script>
