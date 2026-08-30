<template>
  <div class="text-size-14 flex-center-vertical gap-1">
    <currency-dropdown v-model="analyticsStore.analyticsCurrency" is-clearable />

    <div class="app-button-small cursor-pointer" @click="onToggleShowAmounts">
      <app-icon :icon="analyticsStore.isAmountsHidden ? TablerIconConstants.eyeHidden : TablerIconConstants.eyeVisible" :size="20" />
    </div>

    <div class="app-button-small">
      <div class="cursor-pointer" @click="onShowFilters">
        <app-icon :icon="TablerIconConstants.search" :size="18" />
        <span v-if="activeFiltersCount > 0"> {{ activeFiltersCount }}</span>
      </div>
      <div v-if="activeFiltersCount > 0" class="cursor-pointer" @click="onResetFilters">
        <icon-square-rounded-x :size="22" :stroke="1.5" />
      </div>
    </div>

    <analytics-filters ref="analyticsFiltersRef" />
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useProfileStore } from '~/stores/profileStore'
import { useAnalyticsFilters } from '~/composables/useAnalyticsFilters'
import { IconSquareRoundedX } from '@tabler/icons-vue'

const analyticsStore = useAnalyticsStore()
const profileStore = useProfileStore()

const onToggleShowAmounts = () => {
  profileStore.dashboard.showAccountAmounts = !profileStore.dashboard.showAccountAmounts
}

const analyticsFiltersRef = useTemplateRef('analyticsFiltersRef')
const { activeFiltersCount, resetFilters } = useAnalyticsFilters()

const onShowFilters = () => {
  analyticsFiltersRef.value.show()
}

const onResetFilters = () => {
  resetFilters()
}
</script>
