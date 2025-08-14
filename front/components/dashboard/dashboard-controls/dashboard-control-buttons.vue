<template>
  <div class="text-size-14 flex-center-vertical gap-1">
    <currency-dropdown v-model="dataStore.dashboardCurrency" />

    <div class="app-button-small" @click="onToggleShowDashboardAccountValues">
      <app-icon :icon="profileStore.dashboard.showAccountAmounts ? TablerIconConstants.eyeHidden : TablerIconConstants.eyeVisible" :size="20" />
    </div>

    <div class="app-button-small">
      <div @click="onShowFilters">
        <app-icon :icon="TablerIconConstants.search" :size="18" />
        <span v-if="activeFiltersCount > 0"> {{ activeFiltersCount }}</span>
      </div>
      <div v-if="activeFiltersCount > 0" @click="onResetFilters">
        <icon-square-rounded-x :size="22" :stroke="1.5" />
      </div>
    </div>

    <transaction-filters ref="transactionFiltersRef" v-model="filters" :show-date="false" :show-type="false" style="height: 85%" />
  </div>
</template>

<script setup>
import { addMonths } from 'date-fns'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Currency from '~/models/Currency.js'
import { useListFilters } from '~/composables/useListFilters.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { IconSquareRoundedX } from '@tabler/icons-vue'

const dataStore = useDataStore()
const profileStore = useProfileStore()

const transactionFiltersRef = useTemplateRef('transactionFiltersRef')

const hasMultipleCurrencies = computed(() => dataStore.dashboardAccountsCurrencyList.length > 1)

const onToggleShowDashboardAccountValues = async () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}

const onShowFilters = () => {
  transactionFiltersRef.value.show()
}

let { filters, filtersBackendList, activeFiltersCount, activeFilters } = useListFilters({
  filterDefinitions: Object.values(TransactionFilterUtils.filters),
})
const onResetFilters = () => {
  filters.value = {}
}

watch(filters, (newValue) => {
  dataStore.fetchDashboard()
})

watch(filtersBackendList, (newValue) => {
  dataStore.dashboard.backendFilters = newValue
})

</script>
