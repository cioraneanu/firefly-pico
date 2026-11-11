<template>
  <app-card :title="$t('dashboard.expenses_week')" :form="false">
    <div class="mx-trend">
      <div class="mx-trend__hd">
        <div class="mx-kpi">
          <small>{{ $t('desktop.dashboard.spent_last_days', { count: points.length }) }}</small>
          <b class="mx-money">{{ totalFormatted }} {{ currencyCode }}</b>
        </div>
        <span v-if="peak" class="mx-badge mx-money">{{ $t('dash_page.peak', { amount: peak.value, date: format(peak.date, 'd MMM') }) }}</span>
      </div>

      <div class="mx-chart">
        <span class="ar" aria-hidden="true" :style="{ clipPath: areaPath }" />
        <span v-for="(point, index) in segments" :key="`seg-${index}`" class="seg" :style="point" />
        <button
          v-for="(point, index) in points"
          :key="+point.date"
          type="button"
          class="pt"
          :class="{ now: index === points.length - 1 }"
          :aria-label="point.title"
          :title="point.title"
          :style="{ left: `${point.x}%`, top: `${point.y}%` }"
          @click="onClick(point)"
        />
        <span v-if="lastPoint" class="tip mx-money" :style="{ top: `${lastPoint.y}%` }">{{ $t('desktop.dashboard.today_amount', { amount: `${lastPoint.value} ${currencyCode}` }) }}</span>
      </div>

      <div class="mx-xabs" aria-hidden="true">
        <span v-for="(point, index) in points" :key="`x-${index}`" :class="{ first: index === 0, last: index === points.length - 1 }" :style="{ left: `${point.x}%` }">{{ point.label }}</span>
      </div>
    </div>
  </app-card>
</template>

<script setup>
import { format } from 'date-fns'
import { last, maxBy, sumBy } from 'lodash-es'
import Transaction from '~/core/models/Transaction.js'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'

const dashboardStore = useDashboardStore()
const { weekBars: barsList } = useDashboardBars()
const links = useDashboardLinks()

const currencyCode = computed(() => dashboardStore.dashboardCurrencyCode)

// Line chart: x spread evenly, the peak day sits at 14% from the top (design)
const points = computed(() => {
  const step = 100 / Math.max(barsList.value.length - 1, 1)
  return barsList.value.map((bar, index) => ({
    ...bar,
    x: index * step,
    y: 100 - (bar.percent || 0) * 0.86,
    title: `${format(bar.date, 'EEE d MMM')}: ${bar.value} ${currencyCode.value}`,
  }))
})

const segments = computed(() =>
  points.value.slice(0, -1).map((point, index) => {
    const next = points.value[index + 1]
    return { '--x': point.x, '--y': point.y, '--dx': next.x - point.x, '--dy': next.y - point.y }
  }),
)

const areaPath = computed(() => `polygon(${points.value.map((point) => `${point.x}% ${point.y}%`).join(', ')}, 100% 100%, 0% 100%)`)

const lastPoint = computed(() => last(points.value))
const peak = computed(() => {
  const bar = maxBy(barsList.value, 'amount')
  return bar?.amount > 0 ? bar : null
})
const totalFormatted = computed(() => formatNumberForDashboard(sumBy(barsList.value, 'amount')))

const onClick = (bar) => navigateTo(links.byDay(bar.date, Transaction.types.expense))
</script>
