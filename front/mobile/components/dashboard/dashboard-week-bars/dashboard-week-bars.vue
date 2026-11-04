<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.expenses_week') }}:</div>
    <div class="flex gap-2">
      <div class="flex-1" />

      <bar-chart-item-vertical v-for="bar in barsList" v-bind="bar" class="cursor-pointer" @click="onClick(bar)" />

      <div class="flex-1" />
    </div>
  </van-cell-group>
</template>
<script setup>
import Transaction from '~/core/models/Transaction.js'


const { weekBars: barsList } = useDashboardBars()
const links = useDashboardLinks()

const onClick = (bar) => navigateTo(links.byDay(bar.date, Transaction.types.expense))
</script>
