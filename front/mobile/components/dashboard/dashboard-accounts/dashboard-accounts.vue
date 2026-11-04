<template>
  <van-cell-group inset>
    <div class="flex items-center">
      <div class="van-cell-group-title">{{ $t('dashboard.account_total') }}:</div>
    </div>

    <van-grid :column-num="2">
      <van-grid-item v-for="account in dashboardStore.dashboardAccountsVisible" :key="account?.id" class="cursor-pointer" @click="onShowActionSheet(account)">
        <template #icon>
          <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="24" />
        </template>

        <template #text>
          <div class="flex flex-col items-center">
            <div class="font-normal text-12 text-center text-muted">{{ Account.getDisplayName(account) }}</div>
            <div class="font-bold text-12 text-center">{{ getAccountAmount(account) }}</div>
            <template v-if="Account.hasVirtualBalance(account)">
              <div class="font-normal text-11 text-center text-muted">{{ $t('account_page.balance') }}</div>
              <div class="tag-gray app-card-info mt-1 text-11 text-center">{{ $t('account_page.available') }}: {{ getAccountAvailableAmount(account) }}</div>
            </template>
            <div v-if="!Account.getIsIncludedInNetWorth(account)" class="mt-1 font-normal text-11 text-center badge-excluded-net-worth">Not in net worth</div>
          </div>
        </template>
      </van-grid-item>
    </van-grid>

    <div class="flex items-center justify-center text-13 m-2.5 flex-wrap">
      <div class="flex items-center justify-center text-13">
        <icon-cash class="text-muted" :size="24" :stroke="1.5" />
        <span class="font-normal text-muted">{{ $t('dashboard.accounts.by_currency') }}: </span>
      </div>

      <span v-for="(totalValue, totalCurrency) in dashboardStore.dashboardAccountsTotalByCurrency" class="font-bold ms-1 mx-1 app-select-option-tag">
        {{ formatNumberForDashboard(totalValue) }} {{ totalCurrency }}
      </span>
    </div>

    <div v-if="hasAccountGroups" class="flex items-center justify-center text-13 mb-4 gap-1 flex-wrap">
      <div class="flex items-center justify-center text-13">
        <span class="font-normal text-muted">{{ $t('dashboard.accounts.by_group') }}: </span>
      </div>

      <span v-for="(totalValue, groupName) in dashboardStore.dashboardAccountsTotalByGroup" class="font-bold ms-1 mx-1 app-select-option-tag">
        {{ groupName }} | {{ formatNumberForDashboard(totalValue) }} {{ Currency.getCode(dashboardStore.dashboardCurrency) }}
      </span>
    </div>

    <div v-if="hasMultipleCurrencies" class="flex items-center justify-center text-13 mb-4 gap-1">
      <span class="font-normal text-muted">{{ $t('dashboard.accounts.total') }}: </span>
      <span class="font-bold">~{{ accountTotal }} {{ Currency.getCode(dashboardStore.dashboardCurrency) }}</span>
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Account from '~/core/models/Account.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils.js'
import { IconCash, IconLibraryPlus, IconLibraryMinus } from '@tabler/icons-vue'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'
import { useActionSheet } from '~/mobile/composables/useActionSheet.js'
import Currency from '~/core/models/Currency.js'
import { useDashboardStore } from '~/core/stores/dashboardStore.js'

const profileStore = useProfileStore()
const dashboardStore = useDashboardStore()

const showHiddenAccounts = ref(false)
const toggleHiddenAccounts = () => {
  showHiddenAccounts.value = !showHiddenAccounts.value
}

const accountTotal = computed(() => {
  return formatNumberForDashboard(dashboardStore.dashboardAccountsEstimatedTotal)
})

const getAccountAmount = (account) => {
  return `${formatNumberForDashboard(Account.getBalance(account))} ${Account.getCurrencySymbol(account)}`
}

const getAccountAvailableAmount = (account) => {
  return `${formatNumberForDashboard(Account.getAvailableBalance(account))} ${Account.getCurrencySymbol(account)}`
}

const hasMultipleCurrencies = computed(() => dashboardStore.dashboardAccountsCurrencyList.length > 1)
const hasAccountGroups = computed(() => dashboardStore.dashboardAccountsGroupsList.length > 0)

const actionSheet = useActionSheet()
const onShowActionSheet = (account) => {
  actionSheet.show([
    { name: 'Edit account', callback: () => onGoToAccount(account) },
    { name: 'Show transactions', callback: () => onGoToTransactions(account) },
  ])
}

const onGoToTransactions = async (account) => {
  if (account) {
    const filters = TransactionFilterUtils.filters.account.toUrl([account])
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
  }
}

const onGoToAccount = async (account) => {
  if (account?.id) {
    await navigateTo(`${RouteConstants.ROUTE_ACCOUNT_ID}/${account.id}`)
  }
}
</script>
