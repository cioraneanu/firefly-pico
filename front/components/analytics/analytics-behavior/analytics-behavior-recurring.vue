<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.behavior.recurring.title') }}:</div>

    <div v-if="knownRows.length === 0 && detectedRows.length === 0" class="text-size-12 analytics-behavior-empty ml-15 mr-15 mb-2">
      {{ $t('analytics.behavior.recurring.empty') }}
    </div>

    <template v-else>
      <div v-if="knownRows.length > 0" class="ml-15 mr-15 mb-2">
        <div class="text-size-12 text-muted mb-1">{{ $t('analytics.behavior.recurring.known') }}</div>
        <table class="analytics-behavior-recurring-table">
          <tr v-for="row in knownRows" :key="row.id" class="analytics-behavior-row cursor-pointer" @click="onRowClick(row)">
            <td style="width: 1%"><account-badge :value="row.account" /></td>
            <td class="text-size-12 text-muted">{{ row.cadence }}</td>
            <td style="width: 1%">
              <span class="text-size-12 font-weight-400">{{ row.value }}</span>
            </td>
          </tr>
        </table>
      </div>

      <div v-if="detectedRows.length > 0" class="ml-15 mr-15 mb-2">
        <div class="text-size-12 text-muted mb-1">{{ $t('analytics.behavior.recurring.detected') }}</div>
        <table class="analytics-behavior-recurring-table">
          <tr v-for="row in detectedRows" :key="row.id" class="analytics-behavior-row cursor-pointer" @click="onRowClick(row)">
            <td style="width: 1%"><account-badge :value="row.account" /></td>
            <td class="text-size-12 text-muted">{{ $t('analytics.behavior.recurring.occurrences_count', { count: row.occurrenceCount }) }}</td>
            <td style="width: 1%">
              <span class="text-size-12 font-weight-400">{{ row.value }}</span>
            </td>
          </tr>
        </table>
      </div>
    </template>

    <app-chart-table-view v-if="knownRows.length > 0 || detectedRows.length > 0" :title="$t('analytics.behavior.recurring.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.behavior.recurring.merchant') }}</th>
            <th>{{ $t('analytics.behavior.recurring.amount') }}</th>
            <th>{{ $t('analytics.behavior.recurring.cadence') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in knownRows" :key="row.id">
            <td>{{ Account.getDisplayName(row.account) }}</td>
            <td>{{ row.value }}</td>
            <td>{{ row.cadence }}</td>
          </tr>
          <tr v-for="row in detectedRows" :key="row.id">
            <td>{{ Account.getDisplayName(row.account) }}</td>
            <td>{{ row.value }}</td>
            <td>{{ $t('analytics.behavior.recurring.occurrences_count', { count: row.occurrenceCount }) }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import { get } from 'lodash-es'
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

// Known rows carry Firefly's own cadence label (repetitionType.name) — the heuristic below can't
// produce an equivalent since it only ever sees monthly-ish patterns (MonthlyFact's granularity is
// the month), so "detected" rows show occurrence count instead of a cadence name.
const knownRows = computed(() =>
  analyticsStore.knownRecurringRows(months.value).map((row) => ({
    id: `known-${row.merchantId}`,
    merchantId: row.merchantId,
    account: get(row.recurrence, 'attributes.accountDestination') ?? resolveAccount(row.merchantId),
    cadence: get(row.recurrence, 'attributes.repetitionType.name', ''),
    value: formatNumberForDashboard(RecurringTransaction.getAmount(row.recurrence)),
  })),
)

const detectedRows = computed(() =>
  analyticsStore.detectedRecurringRows(months.value).map((candidate) => ({
    id: `detected-${candidate.merchantId}`,
    merchantId: candidate.merchantId,
    account: resolveAccount(candidate.merchantId),
    occurrenceCount: candidate.occurrenceCount,
    value: formatNumberForDashboard(candidate.averageAmount),
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
