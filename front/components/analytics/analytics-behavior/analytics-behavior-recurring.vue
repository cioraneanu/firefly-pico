<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.behavior.recurring.title') }}:</div>

    <div v-if="knownRows.length === 0" class="text-size-12 analytics-behavior-empty ml-15 mr-15 mb-2">
      {{ $t('analytics.behavior.recurring.empty') }}
    </div>

    <template v-else>
      <div class="ml-15 mr-15 mb-2">
        <table class="analytics-behavior-recurring-table">
          <tr v-for="row in knownRows" :key="row.id" class="analytics-behavior-row cursor-pointer" @click="onRowClick(row)">
            <td>
              <div class="flex-center-vertical gap-2">
                <span class="text-size-12 font-weight-400">{{ row.description }}</span>
                <span class="text-size-11 text-muted">{{ row.cadence }}</span>
              </div>
            </td>
            <td style="width: 1%">
              <span class="text-size-12 font-weight-400">{{ row.value }}</span>
            </td>
          </tr>
        </table>
      </div>
    </template>

    <app-chart-table-view v-if="knownRows.length > 0" :title="$t('analytics.behavior.recurring.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.behavior.recurring.description') }}</th>
            <th>{{ $t('analytics.behavior.recurring.total_in_range') }}</th>
            <th>{{ $t('analytics.behavior.recurring.cadence') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in knownRows" :key="row.id">
            <td>{{ row.description }}</td>
            <td>{{ row.value }}</td>
            <td>{{ row.cadence }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import { get } from 'lodash-es'
import { ANALYTICS_RANKED_TOP_N } from '~/constants/AnalyticsConstants'
import Account from '~/models/Account.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAccountStore } from '~/stores/accountStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'

const analyticsStore = useAnalyticsStore()
const accountStore = useAccountStore()
const { months, range } = useAnalyticsRange()
const drillThrough = useChartDrillThrough()
const { t } = useI18n()

function resolveAccount(id) {
  return accountStore.accountDictionary[id] ?? { attributes: { name: t('not_set') } }
}

const knownRows = computed(() =>
  analyticsStore
    .knownRecurringRows(months.value)
    .slice(0, ANALYTICS_RANKED_TOP_N)
    .map((row) => ({
      id: `known-${row.merchantId}`,
      merchantId: row.merchantId,
      description: get(row.recurrence, 'attributes.description', ''),
      cadence: get(row.recurrence, 'attributes.repetitionType.name', ''),
      value: formatNumberForDashboard(row.totalInRange),
    })),
)

const onRowClick = async (row) => {
  await drillThrough.navigate({ start: range.value.start, end: range.value.end, dimension: 'byMerchant', id: row.merchantId })
}
</script>

<style scoped>
.analytics-behavior-empty {
  color: var(--semi-black);
}

.analytics-behavior-recurring-table {
  width: 100%;
}
</style>
