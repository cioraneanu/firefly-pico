<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #subtitle>
        <analytics-control-desktop v-if="appStore.isDesktopLayout" />
      </template>
    </app-top-toolbar>

    <van-pull-refresh v-model="analyticsStore.isRefreshing" @refresh="onRefresh">
      <analytics-control v-if="!appStore.isDesktopLayout" />

      <div class="dynamic-masonry">
        <analytics-headline />
        <analytics-cashflow />
        <analytics-savings-rate />
        <analytics-money-goes-ranked />
        <analytics-money-goes-composition />
        <analytics-money-goes-mom />
        <analytics-money-goes-drift />
        <analytics-money-goes-heatmap />
      </div>

      <app-card-info v-if="analyticsStore.failedMonthKeys.length > 0">
        <div class="flex-center-vertical gap-2">
          <div class="flex-1">{{ $t('analytics.failed_months', { count: analyticsStore.failedMonthKeys.length }) }}</div>
          <van-button size="small" @click="onRetryFailed">{{ $t('analytics.retry') }}</van-button>
        </div>
      </app-card-info>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { useToolbar } from '~/composables/useToolbar'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const appStore = useAppStore()
const analyticsStore = useAnalyticsStore()
const { range, months, priorMonths } = useAnalyticsRange()

const onRefresh = async () => {
  await analyticsStore.refresh({ start: priorMonths.value[0]?.start ?? range.value.start, end: range.value.end })
}

const onRetryFailed = async () => {
  const allMonths = [...months.value, ...priorMonths.value]
  for (const key of analyticsStore.failedMonthKeys) {
    const month = allMonths.find((m) => m.key === key)
    if (month) await analyticsStore.retryMonth(month)
  }
}

onMounted(onRefresh)

// The store stays range/filter-agnostic by design (Phase 1) — it never re-fetches on its own, it
// only knows how to fetch a given range. This page is what has to notice when the range OR the
// analytics filter changes and re-trigger refresh(). Watching currentFilterHash (rather than the
// raw filter refs) covers both the analytics dimensional filter and the persistent Settings
// exclusion list uniformly, since both already feed into that one hash — see analyticsStore.js.
watch([range, () => analyticsStore.currentFilterHash], onRefresh)

const { t } = useI18n()
useToolbar().init({ title: t('analytics.title') })
</script>
