<template>
  <div class="text-size-14 flex-center-vertical gap-1">
    <currency-dropdown v-model="dataStore.dashboardCurrency" />

    <div class="app-button-small" @click="onToggleShowDashboardAccountValues">
      <app-icon :icon="profileStore.dashboard.showAccountAmounts ? TablerIconConstants.eyeHidden : TablerIconConstants.eyeVisible" :size="20" />
    </div>

    <div class="app-button-small" @click="onFilter">
      <app-icon :icon="TablerIconConstants.search" :size="20" />
    </div>

    <transaction-filters ref="transactionFiltersRef" v-model="dataStore.dashboard.filters" :show-date="false" style="height: 85%" />

  </div>
</template>

<script setup>
import { addMonths } from 'date-fns'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Currency from '~/models/Currency.js'

const dataStore = useDataStore()
const profileStore = useProfileStore()

const transactionFiltersRef = useTemplateRef('transactionFiltersRef')


const hasMultipleCurrencies = computed(() => dataStore.dashboardAccountsCurrencyList.length > 1)


const onToggleShowDashboardAccountValues = async () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}

const onFilter = () => {
  transactionFiltersRef.value.show()
}


</script>
