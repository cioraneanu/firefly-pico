<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.behavior.merchants.title') }}:</div>

    <div v-if="rows.length === 0" class="text-size-12 analytics-behavior-empty ml-15 mr-15 mb-2">{{ $t('analytics.behavior.merchants.empty') }}</div>

    <div v-else-if="analyticsStore.isAmountsHidden" class="analytics-behavior-merchants-redacted ml-15 mr-15 mb-2" />

    <div v-else class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="analytics-behavior-row"
          :class="{ 'analytics-behavior-row-top': row.isTop, 'cursor-pointer': row.id !== 'none' && row.id !== 'other' }"
          @click="onRowClick(row)"
        >
          <td style="width: 1%">
            <account-badge :value="row.account" />
          </td>
          <td>
            <bar-chart-item-horizontal :percent="row.percent" :get-background="() => 'var(--viz-expense)'" />
          </td>
          <td style="width: 1%">
            <span class="text-size-12 font-weight-400">{{ row.value }}</span>
          </td>
        </tr>
      </table>
    </div>

    <app-chart-table-view v-if="rows.length > 0" :title="$t('analytics.behavior.merchants.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.behavior.merchants.merchant') }}</th>
            <th>{{ $t('analytics.behavior.merchants.total') }}</th>
            <th>{{ $t('analytics.behavior.merchants.count') }}</th>
            <th>{{ $t('analytics.behavior.merchants.average') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ Account.getDisplayName(row.account) }}</td>
            <td>{{ row.value }}</td>
            <td>{{ row.count }}</td>
            <td>{{ row.averageValue }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import { ANALYTICS_RANKED_TOP_N } from '~/constants/AnalyticsConstants'
import { rankTopNWithOther } from '~/utils/AnalyticsUtils'
import Account from '~/models/Account.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAccountStore } from '~/stores/accountStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'

const analyticsStore = useAnalyticsStore()
const accountStore = useAccountStore()
const { months, range } = useAnalyticsRange()
const drillThrough = useChartDrillThrough()
const { t } = useI18n()

// A stub Account-shaped object for 'none' (and any id whose account has since been archived/
// deleted) — lets account-badge.vue's Account.getIcon/getDisplayName calls resolve without a
// special-cased template branch.
function resolveAccount(id) {
  if (id === 'none') return { attributes: { name: t('not_set') } }
  return accountStore.accountDictionary[id] ?? { attributes: { name: t('not_set') } }
}

const rows = computed(() => {
  const totals = analyticsStore.merchantTotals(months.value) // {[id]: {amount, count}}
  const amountById = Object.fromEntries(Object.entries(totals).map(([id, entry]) => [id, entry.amount]))
  const { topIds, otherIds, otherTotal } = rankTopNWithOther(amountById, ANALYTICS_RANKED_TOP_N)
  const maxAmount = Math.max(...topIds.map((id) => amountById[id]), otherTotal, 1)

  const result = topIds.map((id, index) => {
    const count = totals[id].count
    const amount = totals[id].amount
    return {
      id,
      account: resolveAccount(id),
      value: formatNumberForDashboard(amount),
      count,
      averageValue: formatNumberForDashboard(count ? amount / count : 0),
      percent: (amount / maxAmount) * 100,
      isTop: index === 0,
    }
  })

  if (otherTotal > 0) {
    const otherCount = otherIds.reduce((sum, id) => sum + totals[id].count, 0)
    result.push({
      id: 'other',
      account: { attributes: { name: t('analytics.behavior.merchants.other') } },
      value: formatNumberForDashboard(otherTotal),
      count: otherCount,
      averageValue: formatNumberForDashboard(otherCount ? otherTotal / otherCount : 0),
      percent: (otherTotal / maxAmount) * 100,
      isTop: false,
    })
  }

  return result
})

const onRowClick = async (row) => {
  if (row.id === 'other') return
  await drillThrough.navigate({ start: range.value.start, end: range.value.end, dimension: 'byMerchant', id: row.id })
}
</script>

<style scoped>
.analytics-behavior-empty {
  color: var(--semi-black);
}

.analytics-behavior-row-top :deep(.subtitle) {
  font-weight: 600;
}

.analytics-behavior-merchants-redacted {
  height: 80px;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
}
</style>
