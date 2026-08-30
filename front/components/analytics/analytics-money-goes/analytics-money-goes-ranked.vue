<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.money_goes.ranked.title') }}:</div>
      <app-tabs v-model="dimensionTab" :items="dimensionTabs" />
    </div>

    <div class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr
          v-for="bar in bars"
          :key="bar.id ?? 'other'"
          class="analytics-money-goes-row"
          :class="{ 'analytics-money-goes-row-top': bar.isTop, 'cursor-pointer': !bar.isOther }"
          @click="onRowClick(bar)"
        >
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="bar.icon" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>
          <td>
            <bar-chart-item-horizontal :percent="bar.percent" :get-background="bar.getBackground" />
          </td>
          <td style="width: 1%">
            <span class="text-size-12 font-weight-400">{{ bar.value }}</span>
          </td>
        </tr>
      </table>
    </div>

    <app-chart-table-view :title="$t('analytics.money_goes.ranked.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.money_goes.ranked.by_' + (dimensionTab === 'byCategory' ? 'category' : 'tag')) }}</th>
            <th>{{ $t('amount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bar in bars" :key="bar.id ?? 'other'">
            <td>{{ bar.label }}</td>
            <td>{{ bar.value }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { ANALYTICS_RANKED_TOP_N } from '~/constants/AnalyticsConstants'
import { rankTopNWithOther } from '~/utils/AnalyticsUtils'
import Category from '~/models/Category.js'
import Tag from '~/models/Tag.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'

const analyticsStore = useAnalyticsStore()
const { months, range } = useAnalyticsRange()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const drillThrough = useChartDrillThrough()
const { t } = useI18n()

const dimensionTab = ref('byCategory')
const dimensionTabs = computed(() => [
  { label: t('analytics.money_goes.ranked.by_category'), value: 'byCategory' },
  { label: t('analytics.money_goes.ranked.by_tag'), value: 'byTag' },
])

function resolveEntity(id) {
  if (id === 'none') return null
  return dimensionTab.value === 'byCategory' ? categoryStore.categoryDictionary[id] : tagStore.tagDictionaryById[id]
}

function resolveLabel(id) {
  if (id === 'none') return t('not_set')
  const entity = resolveEntity(id)
  if (!entity) return t('not_set')
  return dimensionTab.value === 'byCategory' ? Category.getDisplayName(entity) : Tag.getDisplayName(entity)
}

const bars = computed(() => {
  const totals = analyticsStore.dimensionTotals(months.value, dimensionTab.value)
  const { topIds, otherTotal } = rankTopNWithOther(totals, ANALYTICS_RANKED_TOP_N)
  const maxAmount = Math.max(...topIds.map((id) => totals[id]), otherTotal, 1)

  const rows = topIds.map((id, index) => ({
    id,
    label: resolveLabel(id),
    icon: (dimensionTab.value === 'byCategory' ? Category.getIcon(resolveEntity(id)) : null) ?? TablerIconConstants[dimensionTab.value === 'byCategory' ? 'category' : 'tag'],
    value: formatNumberForDashboard(totals[id]),
    percent: (totals[id] / maxAmount) * 100,
    isTop: index === 0,
    isOther: false,
    getBackground: () => 'var(--viz-expense)',
  }))

  if (otherTotal > 0) {
    rows.push({
      id: null,
      label: t('analytics.money_goes.ranked.other'),
      icon: TablerIconConstants.category,
      value: formatNumberForDashboard(otherTotal),
      percent: (otherTotal / maxAmount) * 100,
      isTop: false,
      isOther: true,
      getBackground: () => 'var(--viz-other)',
    })
  }

  return rows
})

const onRowClick = async (bar) => {
  await drillThrough.navigate({ start: range.value.start, end: range.value.end, dimension: dimensionTab.value, id: bar.id })
}
</script>

<style scoped>
.analytics-money-goes-row-top :deep(.subtitle) {
  font-weight: 600;
}
</style>
