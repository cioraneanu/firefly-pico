<template>
  <d-card :title="$t('dashboard.expenses_week')" :description="`${formatNumberForDashboard(total)} ${currencyCode}`">
    <div class="flex h-40 items-end gap-2">
      <nuxt-link v-for="bar in weekBars" :key="+bar.date" :to="links.byDay(bar.date, Transaction.types.expense)" class="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
        <span class="text-[11px] tabular-nums text-dim group-hover:text-fg">{{ bar.amount ? bar.value : '' }}</span>
        <span class="w-full rounded-md bg-expense/80 transition-colors group-hover:bg-expense" :style="{ height: `${Math.max(bar.percent || 0, 2)}%` }" />
        <span :class="['text-xs', isToday(bar.date) ? 'font-semibold text-fg' : 'text-dim']">{{ bar.label }}</span>
      </nuxt-link>
    </div>
  </d-card>
</template>

<script setup>
import { isToday } from 'date-fns'
import Currency from '~/core/models/Currency'
import Transaction from '~/core/models/Transaction'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const { weekBars } = useDashboardBars()

const total = computed(() => weekBars.value.reduce((sum, bar) => sum + bar.amount, 0))
const currencyCode = computed(() => Currency.getCode(dashboardStore.dashboardCurrency))
</script>
