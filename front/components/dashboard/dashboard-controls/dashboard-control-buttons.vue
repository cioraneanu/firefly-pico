<template>
  <div class="text-size-14 flex-center-vertical gap-1">
    <span class="text-muted text-size-12">Controls:</span>
    <div class="app-button-small" v-if="hasMultipleCurrencies" @click="onToggleTotalCurrency">
      <app-icon :icon="TablerIconConstants.transaction" :size="14" />
      {{ dataStore.dashboardCurrency }}
    </div>

    <div class="app-button-small" @click="onToggleShowDashboardAccountValues">
      <app-icon :icon="profileStore.dashboard.showAccountAmounts ? TablerIconConstants.eyeHidden : TablerIconConstants.eyeVisible" :size="20" />
    </div>
  </div>
</template>

<script setup>
import { addMonths } from 'date-fns'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const dataStore = useDataStore()
const profileStore = useProfileStore()



const hasMultipleCurrencies = computed(() => dataStore.dashboardAccountsCurrencyList.length > 1)

const onToggleTotalCurrency = () => {
  if (dataStore.dashboardAccountsCurrencyList.length === 0) {
    return
  }
  let index = dataStore.dashboardAccountsCurrencyList.indexOf(dataStore.dashboardCurrency)
  let newIndex = (index + 1) % dataStore.dashboardAccountsCurrencyList.length
  dataStore.dashboardCurrency = dataStore.dashboardAccountsCurrencyList[newIndex]
}

const onToggleShowDashboardAccountValues = async () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}


</script>
