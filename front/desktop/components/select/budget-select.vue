<template>
  <d-select
    v-model="model"
    :options
    :get-label="(item) => Budget.getDisplayName(item)"
    :get-icon="(budget) => Budget.getIcon(budget) ?? IconBasket"
    :icon="IconBasket"
    :placeholder="$t('budget_select')"
    clearable
  />
</template>

<script setup>
import { IconBasket } from '@tabler/icons-vue'
import Budget from '~/core/models/Budget'

const model = defineModel()
const budgetStore = useBudgetStore()
const options = computed(() => budgetStore.budgetList.filter((item) => Budget.isActive(item)))
</script>
