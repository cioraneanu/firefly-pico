<template>
  <d-card :title="$t('dashboard.transactions_summary.title')" :description="rangeTitle">
    <div class="grid grid-cols-3 gap-2">
      <d-dash-tile :label="$t('transaction.type.expense')" :value="totalExpenseFormatted" tone="expense" :icon="IconSquareRoundedMinus" :to="links.byType(Transaction.types.expense)" />
      <d-dash-tile :label="$t('transaction.type.income')" :value="totalIncomeFormatted" tone="income" :icon="IconSquareRoundedPlus" :to="links.byType(Transaction.types.income)" />
      <d-dash-tile :label="$t('transaction.type.transfer')" :value="totalTransferFormatted" tone="transfer" :icon="IconArrowsExchange" :to="links.byType(Transaction.types.transfer)" />
      <d-dash-tile :label="$t('dashboard.transactions_summary.surplus')" :value="totalSurplusFormatted" :icon="IconDelta" />
      <d-dash-tile :label="$t('toolbar.transactions')" :value="dashboardStore.totalTransactionsCount" :icon="IconHash" />
      <d-dash-tile :label="$t('dashboard.transactions_summary.days_remaining')" :value="remainingDays" :icon="IconCalendarDue" />
    </div>
    <h3 class="mb-2 mt-4 text-xs font-medium text-dim">{{ $t('dashboard.transactions_summary.savings_summary') }}</h3>
    <div class="grid grid-cols-3 gap-2">
      <d-dash-tile
        :label="$t('toolbar.transactions')"
        :value="dashboardStore.transactionsListSavingsCount"
        :icon="IconHash"
        :to="dashboardStore.transactionsListSavings.length ? links.savings() : null"
      />
      <d-dash-tile :label="$t('amount')" :value="transactionsListSavingsAmount" :tone="dashboardStore.transactionsListSavingsAmount > 0 ? 'income' : 'expense'" :icon="IconCoin" />
      <d-dash-tile :label="$t('percentage')" :value="savingsPercentFormatted" tone="info" :icon="IconPercentage" />
    </div>
  </d-card>
</template>

<script setup>
import { IconArrowsExchange, IconCalendarDue, IconCoin, IconDelta, IconHash, IconPercentage, IconSquareRoundedMinus, IconSquareRoundedPlus } from '@tabler/icons-vue'
import Transaction from '~/core/models/Transaction'

const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const { rangeTitle, remainingDays, totalExpenseFormatted, totalIncomeFormatted, totalTransferFormatted, totalSurplusFormatted, transactionsListSavingsAmount, savingsPercentFormatted } =
  useDashboardSummary()
</script>
