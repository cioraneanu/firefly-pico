<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.money_goes.mom.title') }}:</div>
      <app-tabs v-model="dimensionTab" :items="dimensionTabs" />
    </div>

    <div v-if="!mom.isLoaded" class="text-size-12 analytics-money-goes-empty ml-15 mr-15 mb-2">{{ $t('analytics.money_goes.mom.not_enough_data') }}</div>

    <div v-else-if="analyticsStore.isAmountsHidden" class="analytics-money-goes-mom-redacted ml-15 mr-15 mb-2" />

    <div v-else class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="row in displayRows" :key="row.id" class="analytics-money-goes-row" :class="{ 'cursor-pointer': row.id !== 'other' }" @click="onRowClick(row)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="row.icon" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(row.label, 25) }}</span>
            </div>
          </td>
          <td><bar-chart-item-diverging :value="row.delta" :max="maxAbs" /></td>
          <td style="width: 1%; white-space: nowrap">
            <span class="text-size-12 font-weight-400">{{ formatDelta(row.delta) }}</span>
          </td>
        </tr>
      </table>
    </div>

    <app-chart-table-view v-if="mom.isLoaded" :title="$t('analytics.money_goes.mom.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.money_goes.ranked.by_' + (dimensionTab === 'byCategory' ? 'category' : 'tag')) }}</th>
            <th>{{ $t('analytics.money_goes.mom.previous') }}</th>
            <th>{{ $t('analytics.money_goes.mom.current') }}</th>
            <th>{{ $t('analytics.money_goes.mom.change') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayRows" :key="row.id">
            <td>{{ row.label }}</td>
            <td>{{ row.previous == null ? '—' : formatNumberForDashboard(row.previous) }}</td>
            <td>{{ row.current == null ? '—' : formatNumberForDashboard(row.current) }}</td>
            <td>{{ formatDelta(row.delta) }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Category from '~/models/Category.js'
import Tag from '~/models/Tag.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const drillThrough = useChartDrillThrough()
const { t } = useI18n()

const dimensionTab = ref('byCategory')
const dimensionTabs = computed(() => [
  { label: t('analytics.money_goes.ranked.by_category'), value: 'byCategory' },
  { label: t('analytics.money_goes.ranked.by_tag'), value: 'byTag' },
])

const mom = computed(() => analyticsStore.monthOverMonthChange(months.value, dimensionTab.value))

function resolveEntity(id) {
  if (id === 'none' || id === 'other') return null
  return dimensionTab.value === 'byCategory' ? categoryStore.categoryDictionary[id] : tagStore.tagDictionaryById[id]
}

function resolveLabel(id) {
  if (id === 'other') return t('analytics.money_goes.mom.other')
  if (id === 'none') return t('not_set')
  const entity = resolveEntity(id)
  if (!entity) return t('not_set')
  return dimensionTab.value === 'byCategory' ? Category.getDisplayName(entity) : Tag.getDisplayName(entity)
}

const displayRows = computed(() =>
  mom.value.rows.map((row) => ({
    ...row,
    label: resolveLabel(row.id),
    icon: (dimensionTab.value === 'byCategory' ? Category.getIcon(resolveEntity(row.id)) : null) ?? TablerIconConstants[dimensionTab.value === 'byCategory' ? 'category' : 'tag'],
  })),
)

const maxAbs = computed(() => Math.max(...mom.value.rows.map((row) => Math.abs(row.delta)), 1))

function formatDelta(value) {
  const formatted = formatNumberForDashboard(Math.abs(value))
  if (formatted === '******') return formatted
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

const onRowClick = async (row) => {
  if (row.id === 'other' || !mom.value.current) return
  await drillThrough.navigate({ start: mom.value.current.start, end: mom.value.current.end, dimension: dimensionTab.value, id: row.id })
}
</script>

<style scoped>
.analytics-money-goes-empty {
  color: var(--semi-black);
}

.analytics-money-goes-mom-redacted {
  height: 80px;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
}
</style>
