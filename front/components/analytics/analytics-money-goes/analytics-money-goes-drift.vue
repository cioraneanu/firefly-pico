<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.money_goes.drift.title') }}:</div>
      <div class="display-flex gap-1">
        <van-popover v-model:show="showDescriptionPopover" placement="bottom-end">
          <div class="text-size-12 p-10" style="max-width: 280px">{{ $t('analytics.money_goes.drift.description') }}</div>

          <template #reference>
            <button type="button" class="app-button-icon">
              <app-icon :icon="TablerIconConstants.settingsAbout" :size="18" />
            </button>
          </template>
        </van-popover>
        <app-tabs v-model="dimensionTab" :items="dimensionTabs" />
      </div>
    </div>

    <div v-if="!drift.isEligible" class="text-size-12 analytics-money-goes-empty ml-15 mr-15 mb-2">{{ $t('analytics.money_goes.drift.not_enough_data') }}</div>

    <div v-else-if="analyticsStore.isAmountsHidden" class="analytics-money-goes-drift-redacted ml-15 mr-15 mb-2" />

    <div v-else class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="row in displayRows" :key="row.id" class="analytics-money-goes-row" :class="{ 'cursor-pointer': row.id !== 'other' }" @click="onRowClick(row)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="row.icon" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(row.label, 25) }}</span>
            </div>
          </td>
          <td><bar-chart-item-diverging :value="row.slope" :max="maxAbs" /></td>
          <td style="width: 1%; white-space: nowrap">
            <span class="text-size-12 font-weight-400">{{ formatSlope(row.slope) }}</span>
          </td>
        </tr>
      </table>
    </div>
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

const showDescriptionPopover = ref(false)

const drift = computed(() => analyticsStore.spendingDrift(months.value, dimensionTab.value))

function resolveEntity(id) {
  if (id === 'none' || id === 'other') return null
  return dimensionTab.value === 'byCategory' ? categoryStore.categoryDictionary[id] : tagStore.tagDictionaryById[id]
}

function resolveLabel(id) {
  if (id === 'other') return t('analytics.money_goes.drift.other')
  if (id === 'none') return t('not_set')
  const entity = resolveEntity(id)
  if (!entity) return t('not_set')
  return dimensionTab.value === 'byCategory' ? Category.getDisplayName(entity) : Tag.getDisplayName(entity)
}

const displayRows = computed(() =>
  drift.value.rows.map((row) => ({
    ...row,
    label: resolveLabel(row.id),
    icon: (dimensionTab.value === 'byCategory' ? Category.getIcon(resolveEntity(row.id)) : null) ?? TablerIconConstants[dimensionTab.value === 'byCategory' ? 'category' : 'tag'],
  })),
)

const maxAbs = computed(() => Math.max(...drift.value.rows.map((row) => Math.abs(row.slope)), 1))

function formatSlope(value) {
  const formatted = formatNumberForDashboard(Math.abs(value))
  if (formatted === '******') return formatted
  const signed = value >= 0 ? `+${formatted}` : `-${formatted}`
  return `${signed}${t('analytics.money_goes.drift.slope_label')}`
}

const onRowClick = async (row) => {
  if (row.id === 'other') return
  await drillThrough.navigate({ start: drift.value.start, end: drift.value.end, dimension: dimensionTab.value, id: row.id })
}
</script>

<style scoped>
.analytics-money-goes-empty {
  color: var(--semi-black);
}

.analytics-money-goes-drift-redacted {
  height: 80px;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
}
</style>
