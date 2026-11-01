<template>
  <d-card :title="$t('budgets')" flush>
    <div class="grid grid-cols-3 gap-2 px-4">
      <d-dash-tile :label="$t('dashboard.budget.budgeted')" :value="`${formatNumberForDashboard(dashboardStore.budgetLimitTotal)} ${dashboardStore.dashboardCurrencyCode}`" />
      <d-dash-tile :label="$t('dashboard.budget.spent')" :value="`${formatNumberForDashboard(dashboardStore.budgetLimitSpent)} ${dashboardStore.dashboardCurrencyCode}`" tone="expense" />
      <d-dash-tile
        :label="$t('dashboard.budget.remaining')"
        :value="`${formatNumberForDashboard(dashboardStore.budgetLimitRemaining)} ${dashboardStore.dashboardCurrencyCode}`"
        :tone="dashboardStore.budgetLimitRemaining < 0 ? 'expense' : 'income'"
      />
    </div>
    <div class="mt-3 divide-y divide-line border-t border-line">
      <nuxt-link v-for="budget in budgets" :key="budget.id" :to="`${RouteConstants.ROUTE_BUDGET_ID}/${budget.id}`" class="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-soft/50">
        <span class="flex items-center gap-2">
          <d-tile :icon="Budget.getIcon(budget) ?? IconBasket" size="sm" />
          <span class="flex-1 truncate font-medium">{{ Budget.getDisplayName(budget) }}</span>
          <span class="text-[13px] tabular-nums">
            <b class="font-medium">{{ spent(budget) }}</b>
            <span class="text-dim"> / {{ get(Budget.getLimit(budget), 'attributes.amount') ?? 0 }} {{ Budget.getCurrencySymbol(budget) }}</span>
          </span>
        </span>
        <d-progress :value="Number(get(Budget.getLimit(budget), 'attributes.percent', 0))" />
        <span class="flex justify-between text-xs text-dim">
          <span :class="get(Budget.getLimit(budget), 'attributes.remaining', 0) < 0 && 'text-danger'"
            >{{ $t('dashboard.budget.remaining') }}: {{ get(Budget.getLimit(budget), 'attributes.remaining', 0) }}</span
          >
          <span>{{ BudgetLimit.getLimitInterval(Budget.getLimit(budget)) }}</span>
        </span>
      </nuxt-link>
    </div>
    <d-empty v-if="!budgets.length" :icon="IconBasket" />
  </d-card>
</template>

<script setup>
import { IconBasket } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Budget from '~/core/models/Budget'
import BudgetLimit from '~/core/models/BudgetLimit'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const dashboardStore = useDashboardStore()
const budgetStore = useBudgetStore()

const budgets = computed(() => budgetStore.budgetList.filter((budget) => Budget.isActive(budget)))
const spent = (budget) => Math.abs(get(Budget.getLimit(budget), 'attributes.spent', 0))
</script>
