<template>
  <d-card :title="$t('dashboard.account_total')" :description="hasManyCurrencies ? `~${mask(formatNumberForDashboard(dashboardStore.dashboardAccountsEstimatedTotal))} ${currencyCode}` : null">
    <div class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
      <d-dash-tile
        v-for="account in dashboardStore.dashboardAccountsVisible"
        :key="account.id"
        :label="Account.getDisplayName(account)"
        :value="mask(`${formatNumberForDashboard(Account.getBalance(account))} ${Account.getCurrencySymbol(account)}`)"
        :hint="
          Account.hasVirtualBalance(account)
            ? `${$t('account_page.available')}: ${mask(formatNumberForDashboard(Account.getAvailableBalance(account)))}`
            : !Account.getIsIncludedInNetWorth(account)
              ? $t('desktop.not_in_net_worth')
              : null
        "
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

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()

const currencyCode = computed(() => Currency.getCode(dashboardStore.dashboardCurrency))
const hasManyCurrencies = computed(() => dashboardStore.dashboardAccountsCurrencyList.length > 1)
const mask = (value) => (profileStore.dashboard.showAccountAmounts ? value : '•••')
</script>
