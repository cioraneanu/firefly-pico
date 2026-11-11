<template>
  <button type="button" class="mx-ib" :aria-label="$t('dash_page.hide_amounts')" :aria-pressed="!profileStore.dashboard.showAccountAmounts" @click="onToggleShowDashboardAccountValues">
    <app-icon :icon="profileStore.dashboard.showAccountAmounts ? TablerIconConstants.eyeVisible : TablerIconConstants.eyeHidden" :size="18" :stroke="2" />
  </button>

  <button v-if="activeFiltersCount > 0" type="button" class="mx-ib" :aria-label="$t('filters.clear')" @click="onResetFilters">
    <app-icon :icon="IconFilterOff" :size="18" :stroke="2" />
  </button>

  <button type="button" class="mx-ib mx-fbtn" :aria-label="$t('filters.transaction_filters')" @click="onShowFilters">
    <app-icon :icon="IconAdjustmentsHorizontal" :size="18" :stroke="2" />
    <span v-if="activeFiltersCount > 0" class="mx-fbtn__n">{{ activeFiltersCount }}</span>
  </button>

  <transaction-filters ref="transactionFiltersRef" v-model="filters" :show-date="false" :show-type="false" />
</template>

<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { useListFilters } from '~/core/composables/useListFilters.js'
import TransactionFilterUtils from '~/core/utils/TransactionFilterUtils.js'
import { IconAdjustmentsHorizontal, IconFilterOff } from '@tabler/icons-vue'

import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()

const transactionFiltersRef = useTemplateRef('transactionFiltersRef')

const onToggleShowDashboardAccountValues = async () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}

const onShowFilters = () => {
  transactionFiltersRef.value.show()
}

const { filters, filtersBackendList, activeFiltersCount } = useListFilters({
  filterDefinitions: Object.values(TransactionFilterUtils.filters),
})
const onResetFilters = () => {
  filters.value = {}
}

watch(filters, () => {
  dashboardStore.fetchDashboard()
})

watch(filtersBackendList, (newValue) => {
  dashboardStore.backendFilters = newValue
})
</script>
