<template>
  <app-select v-model="modelValue" :label="label ?? $t('budget')" :popup-title="$t('budget_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
        <span v-if="isLoading" class="mx-spin" />
        <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
      </button>
    </template>
  </app-select>
</template>

<script setup>
import { IconRefresh } from '@tabler/icons-vue'
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

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await store.fetchBudgets()
  isLoading.value = false
}
</script>
