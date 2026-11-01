<template>
  <d-card :title="$t('budgets')">
    <div class="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-[10px] ring-1 ring-inset ring-line">
      <div v-for="total in totals" :key="total.label" class="flex min-w-0 flex-col gap-0.5 px-3 py-2">
        <span class="text-xs text-dim">{{ total.label }}</span>
        <b class="truncate text-[15px] font-semibold leading-[22px] tabular-nums">{{ total.value }}</b>
      </div>
    </div>
    <div v-if="budgets.length" class="-mx-4 -mb-4 -mt-1 divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="budget in budgets"
        :key="budget.id"
        :to="`${RouteConstants.ROUTE_BUDGET_ID}/${budget.id}`"
        class="flex flex-col gap-2 px-4 py-2.5 transition-colors last:rounded-b-xl hover:bg-soft/50"
      >
        <span class="flex min-w-0 items-center gap-2.5">
          <d-tile :icon="Budget.getIcon(budget) ?? IconBasket" size="sm" muted />
          <span class="flex-1 truncate font-medium">{{ Budget.getDisplayName(budget) }}</span>
          <span class="whitespace-nowrap text-[13px] tabular-nums">
            <b class="font-medium">{{ money(spent(budget), budget) }}</b>
            <span class="text-dim"> / {{ money(limit(budget, 'amount'), budget) }}</span>
          </span>
        </span>
        <span class="pl-[34px]"><d-progress :value="Number(limit(budget, 'percent'))" /></span>
        <span class="flex justify-between gap-2 pl-[34px] text-xs tabular-nums text-dim">
          <span :class="limit(budget, 'remaining') < 0 && 'text-danger'">{{ money(limit(budget, 'remaining'), budget) }}</span>
          <span v-if="Budget.getLimit(budget)">{{ BudgetLimit.getLimitInterval(Budget.getLimit(budget)) }}</span>
        </span>
      </nuxt-link>
    </div>
    <d-empty v-else :icon="IconBasket" />
  </d-card>
</template>

<script setup>
import { IconBasket } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Budget from '~/core/models/Budget'
import BudgetLimit from '~/core/models/BudgetLimit'
import Currency from '~/core/models/Currency'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const budgetStore = useBudgetStore()

const budgets = computed(() => budgetStore.budgetList.filter((budget) => Budget.isActive(budget)))
const symbol = computed(() => Currency.getSymbol(dashboardStore.dashboardCurrency))
const totals = computed(() => [
  { label: t('dashboard.budget.budgeted'), value: `${formatNumberForDashboard(dashboardStore.budgetLimitTotal)} ${symbol.value}` },
  { label: t('dashboard.budget.spent'), value: `${formatNumberForDashboard(dashboardStore.budgetLimitSpent)} ${symbol.value}` },
  { label: t('dashboard.budget.remaining'), value: `${formatNumberForDashboard(dashboardStore.budgetLimitRemaining)} ${symbol.value}` },
])

const limit = (budget, field) => Number(get(Budget.getLimit(budget), `attributes.${field}`, 0)) || 0
const spent = (budget) => Math.abs(limit(budget, 'spent'))
const money = (value, budget) => `${formatNumberForDashboard(value)} ${Budget.getCurrencySymbol(budget)}`
</script>
