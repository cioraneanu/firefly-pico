<template>
  <app-card :title="$t('dashboard.account_total')" :form="false">
    <template #actions>
      <div class="mx-total">
        <b class="mx-money"><app-count-up :value="`~${accountTotal} ${dashboardStore.dashboardCurrencyCode}`" /></b>
      </div>
    </template>

    <template v-for="group in accountGroups" :key="group.key">
      <div v-if="group.title" class="mx-sub">{{ group.title }}</div>
      <div class="mx-tiles">
        <button v-for="account in group.list" :key="account.id" type="button" class="mx-tile" :class="{ off: group.isExcluded }" @click="onShowActions(account)">
          <span class="h">
            <span>{{ Account.getDisplayName(account) }}</span>
            <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="14" :stroke="2" />
          </span>
          <b class="mx-money" :class="{ e: Account.getBalance(account) < 0 }">{{ getAccountAmount(account) }}</b>
          <small v-if="Account.hasVirtualBalance(account)">{{ $t('account_page.available') }}: {{ getAccountAvailableAmount(account) }}</small>
        </button>
      </div>
    </template>

    <div class="mx-sub">{{ $t('dashboard.accounts.by_currency') }}</div>
    <div class="mx-kv">
      <div v-for="(totalValue, totalCurrency) in dashboardStore.dashboardAccountsTotalByCurrency" :key="totalCurrency">
        <span class="k"><app-icon :icon="IconCoins" :size="14" :stroke="2" />{{ totalCurrency }}</span>
        <b class="mx-money">{{ formatNumberForDashboard(totalValue) }} {{ totalCurrency }}</b>
      </div>
    </div>

    <template v-if="hasAccountGroups">
      <div class="mx-sub">{{ $t('dashboard.accounts.by_group') }}</div>
      <div class="mx-kv">
        <div v-for="(totalValue, groupName) in dashboardStore.dashboardAccountsTotalByGroup" :key="groupName">
          <span class="k"><app-icon :icon="IconFolder" :size="14" :stroke="2" />{{ groupName }}</span>
          <b class="mx-money">{{ formatNumberForDashboard(totalValue) }} {{ dashboardStore.dashboardCurrencyCode }}</b>
        </div>
      </div>
    </template>
  </app-card>

  <dashboard-item-sheet
    v-model:show="showActions"
    :title="Account.getDisplayName(selectedAccount)"
    :description="selectedAccount ? getAccountAmount(selectedAccount) : null"
    :edit-label="$t('account_page.title_edit')"
    @edit="onGoToAccount(selectedAccount)"
    @transactions="onGoToTransactions(selectedAccount)"
  />
</template>

<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Account from '~/core/models/Account.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils.js'
import { IconCoins, IconFolder } from '@tabler/icons-vue'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'
import { useDashboardStore } from '~/core/stores/dashboardStore.js'

const dashboardStore = useDashboardStore()
const { t } = useI18n()

const accountTotal = computed(() => {
  return formatNumberForDashboard(dashboardStore.dashboardAccountsEstimatedTotal)
})

// Accounts outside the net worth get their own faded group (design: "Not in net worth")
const accountGroups = computed(() => {
  const accounts = dashboardStore.dashboardAccountsVisible
  const included = accounts.filter((account) => Account.getIsIncludedInNetWorth(account))
  const excluded = accounts.filter((account) => !Account.getIsIncludedInNetWorth(account))
  return [
    { key: 'included', list: included },
    { key: 'excluded', list: excluded, title: t('desktop.not_in_net_worth'), isExcluded: true },
  ].filter((group) => group.list.length > 0)
})

const getAccountAmount = (account) => {
  return `${formatNumberForDashboard(Account.getBalance(account))} ${Account.getCurrencySymbol(account)}`
}

const getAccountAvailableAmount = (account) => {
  return `${formatNumberForDashboard(Account.getAvailableBalance(account))} ${Account.getCurrencySymbol(account)}`
}

const hasAccountGroups = computed(() => dashboardStore.dashboardAccountsGroupsList.length > 0)

const showActions = ref(false)
const selectedAccount = ref(null)
const onShowActions = (account) => {
  selectedAccount.value = account
  showActions.value = true
}

const onGoToTransactions = async (account) => {
  if (account) {
    const filters = TransactionFilterUtils.filters.account.toUrl([account])
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
  }
}

const onGoToAccount = async (account) => {
  if (account) {
    await navigateTo(`${RouteConstants.ROUTE_ACCOUNT_ID}/${account.id}`)
  }
}
</script>
