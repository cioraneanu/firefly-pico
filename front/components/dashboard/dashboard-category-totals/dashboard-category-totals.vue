<template>
  <van-cell-group inset style="overflow: auto">
    <div class="van-cell-group-title">Expenses by categories:</div>
    <div class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="bar in barsList" @click="onClick(bar)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Category.getIcon(bar.category) ?? TablerIconConstants.category" :size="20" />
              <span class="text-size-12 font-weight-400">{{ bar.label }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" :getBackground="getBarColor" />
          </td>

          <td style="width: 1%">
            <div class="display-flex flex-column">
              <span class="text-size-12 font-weight-400">{{ bar.value }}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </van-cell-group>
</template>
<script setup>
import { get } from 'lodash'
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Category from '~/models/Category.js'

const dataStore = useDataStore()

const barsList = computed(() => {
  let dictionary = dataStore.dashboardExpensesByCategory

  let maxAmount = Math.max(...Object.values(dictionary))

  let bars = Object.keys(dictionary).map((categoryId) => {
    let category = dataStore.categoryDictionary[categoryId]
    const amount = dictionary[categoryId]
    const percent = (amount / maxAmount) * 100
    return {
      category: category,
      label: category ? Category.getDisplayName(category) : 'Not set',
      value: getFormattedValue(amount, 0),
      percent: percent,
    }
  })
  return bars.sort((a, b) => b.percent - a.percent).slice(0, 15)
})

const getBarColor = (bar) => {
  return '#F06292'
}

const onClick = async (bar) => {
  const startDate = DateUtils.dateToString(dataStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dataStore.dashboardDateEnd)
  let categoryId = get(bar, 'category.id')
  if (!categoryId) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_category=true&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.expense.code}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?category_id=${categoryId}&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.expense.code}`)
}
</script>
