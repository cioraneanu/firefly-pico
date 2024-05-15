<template>
  <van-cell-group inset style="overflow: auto">
    <div class="flex-center-vertical">
      <div class="van-cell-group-title">Total balance:</div>
      <div class="flex-1" />

      <van-button v-if="hasMultipleCurrencies" @click="onToggleTotalCurrency" size="small" class="mr-10">
        <template #icon>
          <app-icon :icon="TablerIconConstants.transaction" :size="20" />
          {{ dataStore.dashboardCurrency }}
        </template>
      </van-button>

      <van-button @click="onToggleShowDashboardAccountValues" size="small" class="mr-10">
        <template #icon>
          <app-icon :icon="appStore.dashboard.showAccountAmounts ? 'IconEyeX' : 'IconEye'" :size="20" />
          <!--              <van-icon name="eye-o"/>-->
        </template>
      </van-button>
    </div>

    <van-grid :column-num="2">
      <van-grid-item v-for="account in visibleDashboardAccounts" :key="account.id" @click="onGoToTransactions(account)" icon="photo-o">
        <template #icon>
          <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="24" />
        </template>

        <template #text>
          <div class="display-flex flex-column align-items-center">
            <div class="font-400 text-size-12 text-center text-muted">{{ Account.getDisplayName(account) }}</div>
            <div class="font-700 text-size-12 text-center">{{ getAccountAmount(account) }}</div>
          </div>
        </template>
      </van-grid-item>
    </van-grid>

    <div v-if="hasHiddenAccounts" class="flex-center">
      <div @click="toggleHiddenAccounts" class="m-5 button-link">{{ showHiddenAccounts ? 'View less...' : 'View more...' }}</div>
    </div>

    <div class="flex-center text-size-13 m-10 flex-wrap">
      <div class="flex-center text-size-13 me-1">
        <icon-cash class="text-muted" :size="24" :stroke="1.5" />
        <span class="font-400 text-muted">Total: </span>
      </div>

      <span v-for="(totalValue, totalCurrency) in dataStore.dashboardAccountsTotalByCurrency" class="font-700 ms-1 mx-1 app-select-option-tag">
        {{ getFormattedValue(totalValue) }} {{ totalCurrency }}
      </span>
    </div>

    <div v-if="hasMultipleCurrencies" class="flex-center text-size-13 mb-3 gap-1">
      <span class="font-700">~{{ accountTotal }} {{ dataStore.dashboardCurrency }}</span>
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Account from '~/models/Account.js'
import RouteConstants from '~/constants/RouteConstants.js'
import { IconCash } from '@tabler/icons-vue'
import { getFormattedValue } from '~/utils/MathUtils.js'

const appStore = useAppStore()
const dataStore = useDataStore()

const showHiddenAccounts = ref(false)
const toggleHiddenAccounts = () => {
  showHiddenAccounts.value = !showHiddenAccounts.value
}

const visibleDashboardAccounts = computed(() => {
  return showHiddenAccounts.value ? dataStore.dashboardAccounts : dataStore.dashboardAccounts.filter((account) => Account.getIsVisibleOnDashboard(account))
})

const hasHiddenAccounts = computed(() => dataStore.dashboardAccounts.some((account) => !Account.getIsVisibleOnDashboard(account)))

const accountTotal = computed(() => {
  return getFormattedValue(dataStore.dashboardAccountsEstimatedTotal)
})

const onToggleShowDashboardAccountValues = () => {
  appStore.dashboard.showAccountAmounts = !appStore.dashboard.showAccountAmounts
}

const getAccountAmount = (account) => {
  return `${getFormattedValue(Account.getBalance(account))} ${Account.getCurrency(account)}`
}

const hasMultipleCurrencies = computed(() => dataStore.dashboardAccountsCurrencyList.length > 1)

const onToggleTotalCurrency = () => {
  if (dataStore.dashboardAccountsCurrencyList.length === 0) {
    return
  }
  let index = dataStore.dashboardAccountsCurrencyList.indexOf(dataStore.dashboardCurrency)
  let newIndex = (index + 1) % dataStore.dashboardAccountsCurrencyList.length
  dataStore.dashboardCurrency = dataStore.dashboardAccountsCurrencyList[newIndex]
}

const onGoToTransactions = async (account) => {
  if (!account) {
    return
  }
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?account_id=${account.id}`)
}
</script>
