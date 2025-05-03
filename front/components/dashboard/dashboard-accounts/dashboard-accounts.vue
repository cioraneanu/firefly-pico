<template>
  <van-cell-group inset>
    <div class="flex-center-vertical">
      <div class="van-cell-group-title">{{ $t('dashboard.account_total') }}:</div>
    </div>

    <van-grid :column-num="2">
      <van-grid-item v-for="account in dataStore.dashboardAccountsVisible" :key="account.id" @click="onShowActionSheet(account)">
        <template #icon>
          <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="24" />
        </template>

        <template #text>
          <div class="display-flex flex-column align-items-center">
            <div class="font-400 text-size-12 text-center text-muted">{{ Account.getDisplayName(account) }}</div>
            <div class="font-700 text-size-12 text-center">{{ getAccountAmount(account) }}</div>
            <div v-if="!Account.getIsIncludedInNetWorth(account)" class="mt-1 font-400 text-size-11 text-center badge-excluded-net-worth">Not in net worth</div>
          </div>
        </template>
      </van-grid-item>
    </van-grid>

    <div class="flex-center text-size-13 m-10 flex-wrap">
      <div class="flex-center text-size-13 me-1">
        <icon-cash class="text-muted" :size="24" :stroke="1.5" />
        <span class="font-400 text-muted">{{ $t('total') }}: </span>
      </div>

      <span v-for="(totalValue, totalCurrency) in dataStore.dashboardAccountsTotalByCurrency" class="font-700 ms-1 mx-1 app-select-option-tag">
        {{ formatNumberForDashboard(totalValue) }} {{ totalCurrency }}
      </span>
    </div>

    <div v-if="hasMultipleCurrencies" class="flex-center text-size-13 mb-3 gap-1">
      <span class="font-700">~{{ accountTotal }} {{ Currency.getCode(dataStore.dashboardCurrency) }}</span>
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Account from '~/models/Account.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { IconCash, IconLibraryPlus, IconLibraryMinus } from '@tabler/icons-vue'
import { formatNumberForDashboard } from '~/utils/NumberUtils.js'
import { useActionSheet } from '~/composables/useActionSheet.js'
import Currency from '../../../models/Currency.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const showHiddenAccounts = ref(false)
const toggleHiddenAccounts = () => {
  showHiddenAccounts.value = !showHiddenAccounts.value
}

const accountTotal = computed(() => {
  return formatNumberForDashboard(dataStore.dashboardAccountsEstimatedTotal)
})

const getAccountAmount = (account) => {
  return `${formatNumberForDashboard(Account.getBalance(account))} ${Account.getCurrencySymbol(account)}`
}

const hasMultipleCurrencies = computed(() => dataStore.dashboardAccountsCurrencyList.length > 1)

const actionSheet = useActionSheet()
const onShowActionSheet = (account) => {
  actionSheet.show([
    { name: 'Edit account', callback: () => onGoToAccount(account) },
    { name: 'Show transactions', callback: () => onGoToTransactions(account) },
  ])
}

const onGoToTransactions = async (account) => {
  if (account) {
    let filters = TransactionFilterUtils.filters.account.toUrl([account])
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
  }
}

const onGoToAccount = async (account) => {
  if (account) {
    await navigateTo(`${RouteConstants.ROUTE_ACCOUNT_ID}/${account.id}`)
  }
}
</script>
