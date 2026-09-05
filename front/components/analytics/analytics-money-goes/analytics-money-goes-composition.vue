<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.money_goes.composition.title') }}:</div>
      <div class="display-flex gap-1">
        <van-popover v-model:show="showDescriptionPopover" placement="bottom-end">
          <div class="text-size-12 p-10" style="max-width: 280px">{{ $t('analytics.money_goes.composition.description') }}</div>
          <template #reference>
            <button type="button" class="app-button-icon">
              <app-icon :icon="TablerIconConstants.settingsAbout" :size="18" />
            </button>
          </template>
        </van-popover>
        <app-tabs v-model="dimensionTab" :items="dimensionTabs" />
      </div>
    </div>

    <div class="text-size-12 analytics-axis-caption ml-15 mr-15 mb-2">{{ `${$t('analytics.axis.amount')} (${analyticsStore.currencyCode})` }}</div>

    <div class="ml-15 mr-15 mb-2">
      <app-chart-stacked
        :series="displaySeries"
        :rows="composition.rows"
        :format-value="formatCompactNumberForDashboard"
        :aria-label="$t('analytics.money_goes.composition.title')"
        @segment-select="onSegmentSelect"
      />
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'
import { useChartDrillThrough } from '~/composables/useChartDrillThrough'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import Category from '~/models/Category.js'
import Tag from '~/models/Tag.js'

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

const showDescriptionPopover = ref(false)

const composition = computed(() => analyticsStore.compositionSeries(months.value, dimensionTab.value))

function resolveLabel(id) {
  if (id === 'none') return t('not_set')
  const entity = dimensionTab.value === 'byCategory' ? categoryStore.categoryDictionary[id] : tagStore.tagDictionaryById[id]
  if (!entity) return t('not_set')
  return dimensionTab.value === 'byCategory' ? Category.getDisplayName(entity) : Tag.getDisplayName(entity)
}

// Resolves each series id to a display label (store stays model-free, Part 3's convention) and
// wraps colorVar in var(...) for the DOM legend swatch — app-chart-stacked/app-chart-frame
// resolve the same var NAME to a literal for the canvas layer.
const displaySeries = computed(() =>
  composition.value.series.map((s) => ({
    ...s,
    label: s.id === 'other' ? t('analytics.money_goes.composition.other') : resolveLabel(s.id),
  })),
)

const onSegmentSelect = async ({ monthKey, seriesId }) => {
  const month = months.value.find((m) => m.key === monthKey)
  if (!month) return
  await drillThrough.navigate({ start: month.start, end: month.end, dimension: dimensionTab.value, id: seriesId })
}
</script>

<style scoped>
.analytics-axis-caption {
  color: var(--semi-black);
}
</style>
