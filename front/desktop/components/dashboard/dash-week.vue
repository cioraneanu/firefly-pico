<template>
  <d-card :title="$t('dashboard.expenses_week')">
    <div class="mb-3 flex items-end justify-between gap-3">
      <div class="flex flex-col gap-0.5">
        <small class="text-xs text-dim">{{ $t('desktop.dashboard.spent_last_days', { count: weekBars.length }) }}</small>
        <b class="text-2xl font-semibold tracking-[-0.02em] tabular-nums">{{ money(total) }}</b>
      </div>
      <span
        v-if="previousWeekTotal"
        :class="['inline-flex h-5 items-center gap-[3px] whitespace-nowrap rounded-full px-[7px] text-xs font-medium', isDown ? 'bg-income/12 text-income' : 'bg-danger/10 text-danger']"
      >
        <component :is="isDown ? IconTrendingDown : IconTrendingUp" :size="12" :stroke-width="2" />
        {{ delta }} {{ $t('desktop.dashboard.vs_previous_days', { count: weekBars.length }) }}
      </span>
    </div>
    <div class="relative h-32">
      <svg class="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon :points="`${line} 100,100 0,100`" class="fill-fg/7" />
        <polyline :points="line" class="fill-none stroke-fg" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      </svg>
      <nuxt-link
        v-for="(point, index) in points"
        :key="index"
        :to="links.byDay(point.date, Transaction.types.expense)"
        :title="point.title"
        :aria-label="point.title"
        :class="['absolute z-1 -ml-[5px] -mt-[5px] size-2.5 rounded-full shadow-[0_0_0_2px_var(--d-fg)] transition-transform hover:scale-130', point.isLast ? 'bg-fg' : 'bg-card']"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
      />
      <span
        class="pointer-events-none absolute left-full -mt-3 -translate-y-full translate-x-[calc(-100%_+_5px)] whitespace-nowrap rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-on-primary"
        :style="{ top: `${points.at(-1)?.y}%` }"
        >{{ $t('desktop.dashboard.today_amount', { amount: money(weekBars.at(-1)?.amount ?? 0) }) }}</span
      >
    </div>
    <div class="relative mt-2.5 h-4 text-xs text-dim" aria-hidden="true">
      <span
        v-for="(point, index) in points"
        :key="index"
        :class="['absolute', index === 0 ? '' : point.isLast ? '-translate-x-full font-medium text-fg' : '-translate-x-1/2']"
        :style="{ left: `${point.x}%` }"
        >{{ point.label }}</span
      >
    </div>
  </d-card>
</template>

<script setup>
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-vue'
import Currency from '~/core/models/Currency'
import Transaction from '~/core/models/Transaction'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const { weekBars, previousWeekTotal } = useDashboardBars()

const money = (value) => `${formatNumberForDashboard(value)} ${Currency.getSymbol(dashboardStore.dashboardCurrency)}`
const total = computed(() => weekBars.value.reduce((sum, bar) => sum + bar.amount, 0))
const isDown = computed(() => total.value < previousWeekTotal.value)
const delta = computed(() => `${isDown.value ? '−' : '+'}${Math.abs(Math.round((total.value / previousWeekTotal.value - 1) * 100))}%`)

const points = computed(() => {
  const max = Math.max(...weekBars.value.map((bar) => bar.amount), 1)
  return weekBars.value.map((bar, index) => ({
    date: bar.date,
    label: bar.label,
    title: `${bar.label} ${DateUtils.dateToUI(bar.date)}: ${money(bar.amount)}`,
    x: (index / (weekBars.value.length - 1)) * 100,
    y: 100 - (bar.amount / max) * 88,
    isLast: index === weekBars.value.length - 1,
  }))
})
const line = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '))
</script>
