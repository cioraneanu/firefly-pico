<template>
  <d-card :title="$t('calendar')" :description="title">
    <div class="grid grid-cols-7 gap-1 text-center">
      <span v-for="day in weekdays" :key="day" class="pb-1 text-xs text-dim">{{ day }}</span>
      <template v-for="day in days" :key="+day">
        <nuxt-link
          v-if="isInRange(day)"
          :to="links.byDay(day)"
          :class="['flex min-h-14 flex-col items-stretch gap-0.5 rounded-md p-1 text-left transition-colors hover:bg-soft', isToday(day) && 'ring-1 ring-ring', isWeekend(day) && 'bg-soft/40']"
        >
          <span :class="['text-xs tabular-nums', isToday(day) ? 'font-semibold' : 'text-dim']">{{ getDate(day) }}</span>
          <span v-for="type in types" v-show="amount(day, type)" :key="type" :class="['truncate text-[11px] font-medium tabular-nums leading-tight', `text-${type}`]">{{ amount(day, type) }}</span>
        </nuxt-link>
        <span v-else />
      </template>
    </div>
  </d-card>
</template>

<script setup>
import { addDays, eachDayOfInterval, endOfWeek, format, getDate, isToday, isWeekend, startOfWeek } from 'date-fns'
import { get } from 'lodash-es'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const links = useDashboardLinks()

const types = ['income', 'expense', 'transfer']
const weekOptions = computed(() => ({ weekStartsOn: profileStore.weekStartsOn }))
const start = computed(() => dashboardStore.dashboardDateStart)
const end = computed(() => dashboardStore.dashboardDateEnd)

const title = computed(() => start.value && `${format(start.value, 'MMMM yyyy')}`)
const weekdays = computed(() => Array.from({ length: 7 }, (_, index) => format(addDays(startOfWeek(new Date(), weekOptions.value), index), 'EEEEEE')))
const days = computed(() => (start.value ? eachDayOfInterval({ start: startOfWeek(start.value, weekOptions.value), end: endOfWeek(end.value, weekOptions.value) }) : []))

const isInRange = (day) => day >= start.value && day <= end.value
const amount = (day, type) => {
  const value = get(dashboardStore.dashboardCalendarTransactionsByDate, `${format(day, 'yyyy-MM-dd')}.${type}`)
  return value ? formatNumberForDashboard(value) : null
}
</script>
