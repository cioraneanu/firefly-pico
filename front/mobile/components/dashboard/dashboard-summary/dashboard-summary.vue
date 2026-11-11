<template>
  <app-card :title="$t('dashboard.transactions_summary.title')" :form="false">
    <div class="mx-tiles c3">
      <component :is="tile.onClick ? 'button' : 'div'" v-for="tile in summaryTiles" :key="tile.title" :type="tile.onClick ? 'button' : null" class="mx-tile" @click="tile.onClick?.()">
        <span class="h"
          ><span>{{ tile.title }}</span></span
        >
        <b class="mx-money" :class="tile.class">{{ tile.value }}</b>
      </component>
    </div>
  </app-card>

  <app-card :title="$t('dashboard.transactions_summary.savings_summary')" :form="false">
    <div class="mx-tiles c3">
      <button v-for="tile in savingsTiles" :key="tile.title" type="button" class="mx-tile" @click="onNavigateToTransactionSavings">
        <span class="h"
          ><span>{{ tile.title }}</span></span
        >
        <b class="mx-money" :class="tile.class">{{ tile.value }}</b>
      </button>
    </div>
  </app-card>
</template>
<script setup>
import Transaction from '~/core/models/Transaction.js'

import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const { t } = useI18n()

const { remainingDays, totalExpenseFormatted, totalIncomeFormatted, totalTransferFormatted, totalSurplusFormatted, transactionsListSavingsAmount, savingsPercentFormatted } = useDashboardSummary()

const links = useDashboardLinks()
const onGoToTransactionsByType = (transactionType) => navigateTo(links.byType(transactionType))

watch(
  () => dashboardStore.month,
  () => {
    dashboardStore.fetchTransactionsForInterval()
  },
)

const summaryTiles = computed(() => [
  { title: t('transaction.type.income'), value: totalIncomeFormatted.value, onClick: () => onGoToTransactionsByType(Transaction.types.income) },
  { title: t('transaction.type.expense'), value: totalExpenseFormatted.value, onClick: () => onGoToTransactionsByType(Transaction.types.expense) },
  { title: t('transaction.type.transfer'), value: totalTransferFormatted.value, onClick: () => onGoToTransactionsByType(Transaction.types.transfer) },
  { title: t('dashboard.transactions_summary.surplus'), value: totalSurplusFormatted.value, class: { e: dashboardStore.totalSurplusThisMonth < 0 } },
  { title: t('toolbar.transactions'), value: dashboardStore.totalTransactionsCount },
  { title: t('dashboard.transactions_summary.days_remaining'), value: remainingDays.value },
])

const savingsTiles = computed(() => [
  { title: t('toolbar.transactions'), value: dashboardStore.transactionsListSavingsCount },
  { title: t('amount'), value: transactionsListSavingsAmount.value, class: { e: dashboardStore.transactionsListSavingsAmount < 0 } },
  { title: t('percentage'), value: savingsPercentFormatted.value },
])

const onNavigateToTransactionSavings = () => dashboardStore.transactionsListSavings.length > 0 && navigateTo(links.savings())
</script>
