<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.net_worth.assets_liabilities.title') }}:</div>
      <div class="display-flex gap-1">
        <van-popover v-model:show="showDescriptionPopover" placement="bottom-end">
          <div class="text-size-12 p-10" style="max-width: 280px">{{ $t('analytics.net_worth.assets_liabilities.description') }}</div>
          <template #reference>
            <button type="button" class="app-button-icon">
              <app-icon :icon="TablerIconConstants.settingsAbout" :size="18" />
            </button>
          </template>
        </van-popover>
        <div class="analytics-networth-legend text-size-12">
          <span class="analytics-networth-legend-dot viz-income-dot" />{{ $t('analytics.net_worth.assets_liabilities.assets') }} <span class="analytics-networth-legend-dot viz-expense-dot" />{{
            $t('analytics.net_worth.assets_liabilities.liabilities')
          }}
          <span class="analytics-networth-legend-dot viz-net-dot" />{{ $t('analytics.net_worth.assets_liabilities.net') }}
        </div>
      </div>
    </div>

    <div class="text-size-12 analytics-networth-fx-note ml-15 mr-15 mb-2">{{ `${$t('analytics.axis.amount')} (${analyticsStore.currencyCode})` }}</div>

    <div class="ml-15 mr-15 mb-2">
      <!-- No @month-select — same non-interactive rationale as analytics-networth-line.vue: a
           balance snapshot has no "transactions that produced this number" to filter to. -->
      <app-chart-bars
        :rows="totals"
        :format-value="formatCompactNumberForDashboard"
        :aria-label="$t('analytics.net_worth.assets_liabilities.title')"
        :income-label="$t('analytics.net_worth.assets_liabilities.assets')"
        :expense-label="$t('analytics.net_worth.assets_liabilities.liabilities')"
        :net-label="$t('analytics.net_worth.assets_liabilities.net')"
      />
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()

const showDescriptionPopover = ref(false)

const totals = computed(() => analyticsStore.assetsLiabilitiesTotals(months.value))
</script>

<style scoped>
.analytics-networth-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--semi-black);
  white-space: nowrap;
}

.analytics-networth-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
}

.analytics-networth-legend-dot:first-child {
  margin-left: 0;
}

.viz-income-dot {
  background: var(--viz-income);
}

.viz-expense-dot {
  background: var(--viz-expense);
}

.viz-net-dot {
  background: var(--semi-black);
}

.analytics-networth-fx-note {
  color: var(--semi-black);
}
</style>
