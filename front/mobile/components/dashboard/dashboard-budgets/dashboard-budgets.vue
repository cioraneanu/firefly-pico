<template>
  <app-card :title="$t('budgets')" :form="false">
    <template #actions>
      <span class="mx-badge">{{ dashboardStore.dashboardCurrencyCode }}</span>
    </template>

    <template v-if="hasBudgets">
      <div class="mx-stat3">
        <div class="mx-stat">
          <span>{{ $t('dashboard.budget.budgeted') }}</span>
          <b class="mx-money">{{ formatNumberForDashboard(dashboardStore.budgetLimitTotal) }}</b>
        </div>
        <div class="mx-stat">
          <span>{{ $t('dashboard.budget.spent') }}</span>
          <b class="mx-money">{{ formatNumberForDashboard(dashboardStore.budgetLimitSpent) }}</b>
        </div>
        <div class="mx-stat">
          <span>{{ $t('dashboard.budget.remaining') }}</span>
          <b class="mx-money">{{ formatNumberForDashboard(dashboardStore.budgetLimitRemaining) }}</b>
        </div>
      </div>

      <div class="mx-bars mt-3.5">
        <dashboard-budget-item v-for="budget in budgetList" :key="budget.id" :value="budget" />
      </div>
    </template>

    <div v-else class="mx-inline-empty">
      <app-icon :icon="TablerIconConstants.budget" :size="16" :stroke="2" />
      <span>{{ $t('dash_page.no_budgets') }}</span>
    </div>
  </app-card>
</template>

<script setup>
import DashboardBudgetItem from '~/mobile/components/dashboard/dashboard-budgets/dashboard-budget-item.vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Budget from '~/core/models/Budget.js'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'

const budgetStore = useBudgetStore()
const dashboardStore = useDashboardStore()

const budgetList = computed(() => budgetStore.budgetList.filter((item) => Budget.isActive(item)))
const hasBudgets = computed(() => budgetList.value.length > 0)
</script>
