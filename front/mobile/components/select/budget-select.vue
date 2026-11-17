<template>
  <app-select v-model="modelValue" :label="label ?? $t('budget')" :popup-title="$t('budget_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <app-refresh-button :refresh="store.fetchBudgets" />
    </template>
  </app-select>
</template>

<script setup>
import { useBudgetStore } from '~/core/stores/budgetStore'
import Budget from '~/core/models/Budget'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

defineProps({
  label: { type: String },
})

const store = useBudgetStore()
const modelValue = defineModel()

const list = computed(() => store.budgetList.filter((item) => Budget.isActive(item)))

const getDisplayValue = (value) => Budget.getDisplayName(value)
const getIcon = (value) => Budget.getIcon(value) ?? TablerIconConstants.budget
</script>
