<template>
  <van-cell-group inset style="overflow: auto">

    <div class="flex-center-vertical">
      <div class="van-cell-group-title">Total balance:</div>
      <div class="flex-1"/>
      <van-button
          @click="onToggleShowDashboardAccountValues"
          size="small"
          class="mr-10">
        <template #icon>
          <app-icon :icon="appStore.dashboard.showAccountAmounts ? 'IconEyeX' : 'IconEye'" :size="20"/>
          <!--              <van-icon name="eye-o"/>-->
        </template>
      </van-button>
    </div>


    <van-grid :column-num="2">
      <van-grid-item v-for="account in dataStore.dashboardAccounts"
                     :key="account.id"
                     @click="onGoToTransactions(account)"
                     icon="photo-o">

        <template #icon>
          <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="24"/>
        </template>


        <template #text>
          <div class="display-flex flex-column align-items-center">
            <div class="font-400 text-size-12 text-center text-muted">{{ Account.getDisplayName(account) }}</div>
            <div class="font-700 text-size-12 text-center">{{ getAccountAmount(account) }}</div>
          </div>
        </template>
      </van-grid-item>
    </van-grid>


    <div class="flex-center text-size-13 m-10">
      <icon-cash class="text-muted" :size="24" :stroke="1.5"/>
      <span class="font-400 text-muted">Total: </span>
      <span class="font-700 ms-1 me-2">~{{ accountTotal }} {{ dataStore.accountTotalCurrency }}</span>
      <van-button
          @click="onToggleTotalCurrency"
          size="small"
          style="height: 25px; padding: 0px 4px;">
        <icon-switch2 :size="20" :stroke="1.5"/>

      </van-button>
    </div>


    <div class="flex-center text-size-13 m-10">
      <icon-cash class="text-muted" :size="24" :stroke="1.5"/>
      <span class="font-400 text-muted">Total: </span>
      <span class="font-700 ms-1 me-2">~{{ accountTotal }} {{ dataStore.accountTotalCurrency }}</span>
      <van-button
          @click="onToggleTotalCurrency"
          size="small"
          style="height: 25px; padding: 0px 4px;">
        <icon-switch2 :size="20" :stroke="1.5"/>

      </van-button>
    </div>

  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Account from '~/models/Account.js'
import RouteConstants from '~/constants/RouteConstants.js'
import {IconCash, IconSum, IconSwitchVertical, IconSwitch2} from "@tabler/icons-vue";
import {getFormattedValue} from "~/utils/MathUtils.js";

const appStore = useAppStore()
const dataStore = useDataStore()

const accountTotal = computed(() => {
  return getFormattedValue(dataStore.accountTotal)
})

const onToggleShowDashboardAccountValues = () => {
  appStore.dashboard.showAccountAmounts = !appStore.dashboard.showAccountAmounts
}

const getAccountAmount = (account) => {
  return `${getFormattedValue(Account.getBalance(account))} ${Account.getCurrency(account)}`
}

const onToggleTotalCurrency = () => {
  if (dataStore.dashboardAccountsCurrencyList.length === 0) {
    return
  }
  let index = dataStore.dashboardAccountsCurrencyList.indexOf(dataStore.accountTotalCurrency)
  let newIndex = (index + 1) % dataStore.dashboardAccountsCurrencyList.length
  dataStore.accountTotalCurrency = dataStore.dashboardAccountsCurrencyList[newIndex]
}

const onGoToTransactions = async (account) => {
  if (!account) {
    return
  }
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?account_id=${account.id}`)
}

</script>