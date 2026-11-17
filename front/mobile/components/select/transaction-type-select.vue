<template>
  <app-select v-model="modelValue" :label="$t('transaction_type')" :popup-title="$t('transaction_type')" :list="list" :get-display-value="getDisplayValue" :has-search="false">
    <template #item="{ item }">
      <span class="ic" :style="{ color: getColor(item) }"><app-icon :icon="getIcon(item)" :size="16" :stroke="2" /></span>
      <span class="lb">{{ getDisplayValue(item) }}</span>
    </template>

    <template #inputItemContent="{ item }">
      <app-icon :icon="getIcon(item)" :size="16" :stroke="2" :style="{ color: getColor(item) }" />
      <span class="tx">{{ getDisplayValue(item) }}</span>
    </template>
  </app-select>
</template>

<script setup>
import { IconCircleArrowRight, IconCircleMinus, IconCirclePlus } from '@tabler/icons-vue'
import Transaction from '~/core/models/Transaction.js'

// Transaction type picker; type icons and colors as the design's type pills.
const { t } = useI18n()

const modelValue = defineModel()
const list = Transaction.typesList

const getDisplayValue = (item) => t(item.t)

const typeStyle = {
  [Transaction.types.expense.code]: { icon: IconCircleMinus, color: 'var(--t-exp)' },
  [Transaction.types.income.code]: { icon: IconCirclePlus, color: 'var(--t-inc)' },
  [Transaction.types.transfer.code]: { icon: IconCircleArrowRight, color: 'var(--t-tr)' },
}
const getIcon = (item) => typeStyle[item?.code]?.icon
const getColor = (item) => typeStyle[item?.code]?.color
</script>
