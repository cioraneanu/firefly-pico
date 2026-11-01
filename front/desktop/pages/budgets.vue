<template>
  <d-page :title="$t('budgets')" :description="$t('desktop.budgets_description')">
    <template #actions>
      <d-refresh-button :action="refresh" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_BUDGET_ID">{{ $t('budget_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="budget in filtered"
        :key="budget.id"
        :title="Budget.getDisplayName(budget)"
        :subtitle="subtitle(budget)"
        :icon="Budget.getIcon(budget) ?? IconBasket"
        :to="`${RouteConstants.ROUTE_BUDGET_ID}/${budget.id}`"
        :active="budget.id === id"
        :class="!Budget.isActive(budget) && 'opacity-60'"
      >
        <template v-if="!Budget.isActive(budget)" #title>
          <d-badge>{{ $t('desktop.inactive') }}</d-badge>
        </template>
        <span v-if="Budget.getLimit(budget)" class="flex w-56 flex-col gap-1.5">
          <span class="flex justify-between text-xs tabular-nums text-dim">
            <span>{{ limitText(budget) }}</span>
            <span>{{ Math.round(Budget.getLimit(budget).attributes.percent ?? 0) }}%</span>
          </span>
          <d-progress :value="Budget.getLimit(budget).attributes.percent ?? 0" />
        </span>
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconBasket" />
    </d-list>

    <d-budget-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconBasket, IconPlus } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Budget from '~/core/models/Budget'

const budgetStore = useBudgetStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_BUDGET_LIST)
const { search, filtered } = useSearch(
  () => budgetStore.budgetList,
  (item) => Budget.getDisplayName(item),
)

const refresh = () => Promise.all([budgetStore.fetchBudgets(), budgetStore.fetchBudgetLimits()])
const subtitle = (budget) => [get(budget, 'attributes.auto_budget_type.name'), get(budget, 'attributes.auto_budget_period.name')].filter(Boolean).join(' · ')
const limitText = (budget) => `${Math.abs(get(Budget.getLimit(budget), 'attributes.spent', 0))} / ${get(Budget.getLimit(budget), 'attributes.amount', 0)} ${Budget.getCurrencySymbol(budget)}`
</script>
