<template>
  <d-card :title="$t('calendar')" :description="title">
    <div class="grid grid-cols-7 gap-1 tabular-nums">
      <span v-for="day in weekdays" :key="day" class="flex h-5.5 items-center justify-center text-xs text-dim">{{ day }}</span>
      <template v-for="day in days" :key="+day">
        <nuxt-link
          v-if="isInRange(day)"
          :to="links.byDay(day)"
          :class="['flex min-h-16 min-w-0 flex-col gap-0.5 rounded-[10px] p-1 transition-colors', isToday(day) ? 'bg-fg text-bg' : isFuture(day) ? 'bg-soft/30 text-dim' : 'bg-soft/75 hover:bg-soft']"
        >
          <span class="px-[3px] pt-px text-xs font-semibold leading-[14px]">{{ getDate(day) }}</span>
          <span v-if="rows(day).length" class="mt-auto flex flex-col rounded-[7px] bg-card px-1 py-[3px] text-fg shadow-[0_1px_1px_rgb(0_0_0/0.04)]">
            <span v-for="row in rows(day)" :key="row.type" class="flex flex-wrap items-baseline justify-between gap-0.5 whitespace-nowrap text-[10.5px] leading-[13px]">
              <small class="text-[9px] font-medium uppercase tracking-[.02em] text-dim">{{ row.label }}</small>
              <b :class="['ml-auto font-semibold', row.color]">{{ row.value }}</b>
            </span>
          </span>
        </nuxt-link>
        <span v-else />
      </template>
    </div>
  </d-card>
</template>

<script setup>
import { addDays, eachDayOfInterval, endOfWeek, format, getDate, isFuture, isToday, startOfWeek } from 'date-fns'
import { get } from 'lodash-es'
import Currency from '~/core/models/Currency'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const { t, locale } = useI18n()
const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const links = useDashboardLinks()

const types = [
  { type: 'expense', label: 'desktop.dashboard.out', color: 'text-danger' },
  { type: 'income', label: 'desktop.dashboard.in', color: 'text-income' },
  { type: 'transfer', label: 'desktop.dashboard.moved', color: 'text-transfer' },
]
const weekOptions = computed(() => ({ weekStartsOn: profileStore.weekStartsOn }))
const start = computed(() => dashboardStore.dashboardDateStart)
const end = computed(() => dashboardStore.dashboardDateEnd)

const title = computed(
  () =>
    start.value &&
    `${start.value.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' })} · ${t('desktop.dashboard.amounts_in', { currency: Currency.getSymbol(dashboardStore.dashboardCurrency) })}`,
)
const weekdays = computed(() => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(new Date(), weekOptions.value), index).toLocaleDateString(locale.value, { weekday: 'short' })))
const days = computed(() => (start.value ? eachDayOfInterval({ start: startOfWeek(start.value, weekOptions.value), end: endOfWeek(end.value, weekOptions.value) }) : []))

const isInRange = (day) => day >= start.value && day <= end.value
const rows = (day) =>
  types
    .map((row) => ({ ...row, label: t(row.label), amount: get(dashboardStore.dashboardCalendarTransactionsByDate, `${format(day, 'yyyy-MM-dd')}.${row.type}`) }))
    .filter((row) => row.amount)
    .map((row) => ({ ...row, value: formatNumberForDashboard(row.amount) }))
</script>
