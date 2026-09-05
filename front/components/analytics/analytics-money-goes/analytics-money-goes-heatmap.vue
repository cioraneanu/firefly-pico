<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.money_goes.heatmap.title') }}:</div>
      <app-tabs v-model="normalizeTab" :items="normalizeTabs" />
    </div>

    <div class="ml-15 mr-15 mb-2">
      <app-chart-heatmap
        :rows="displayRows"
        :months="months"
        :max-value="matrix.maxValue"
        :normalize="normalizeTab === 'normalized'"
        :format-value="formatNumberForDashboard"
        :aria-label="$t('analytics.money_goes.heatmap.title')"
        @cell-select="onCellSelect"
      />
    </div>

    <app-chart-table-view :title="$t('analytics.money_goes.heatmap.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.money_goes.ranked.by_category') }}</th>
            <th v-for="month in months" :key="month.key">{{ month.key.slice(5) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayRows" :key="row.id">
            <td>{{ row.label }}</td>
            <td v-for="cell in row.values" :key="cell.key">{{ cell.isLoaded ? formatNumberForDashboard(cell.value) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import Category from '~/models/Category.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'
import { useCategoryStore } from '~/stores/categoryStore'

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()
const categoryStore = useCategoryStore()
const drillThrough = useChartDrillThrough()
const { t } = useI18n()

// Category-only per ANALYTICS_PLAN.md Part 1/2's unambiguous "Category x month heatmap" wording
// — no byCategory/byTag toggle here, unlike Ranked/Composition/MoM/Drift.
const normalizeTab = ref('normalized')
const normalizeTabs = computed(() => [
  { label: t('analytics.money_goes.heatmap.raw'), value: 'raw' },
  { label: t('analytics.money_goes.heatmap.normalize'), value: 'normalized' },
])

const matrix = computed(() => analyticsStore.categoryMonthMatrix(months.value))

function resolveLabel(id) {
  if (id === 'none') return t('not_set')
  const entity = categoryStore.categoryDictionary[id]
  return entity ? Category.getDisplayName(entity) : t('not_set')
}

const displayRows = computed(() => matrix.value.rows.map((row) => ({ ...row, label: resolveLabel(row.id) })))

const onCellSelect = async ({ monthKey, id }) => {
  const month = months.value.find((m) => m.key === monthKey)
  if (!month) return
  await drillThrough.navigate({ start: month.start, end: month.end, dimension: 'byCategory', id })
}
</script>
