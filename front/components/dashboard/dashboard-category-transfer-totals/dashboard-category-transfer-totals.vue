<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.transfers_by_categories') }}:</div>
    <div class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="bar in barsList" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Category.getIcon(bar.category) ?? TablerIconConstants.category" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
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
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'
import { useActionSheet } from '~/composables/useActionSheet.js'

const dataStore = useDataStore()
const { t } = useI18n()

const barsList = computed(() => {
  let dictionary = dataStore.dashboardTransfersByCategory

  let maxAmount = Math.max(...Object.values(dictionary))

  let bars = Object.keys(dictionary).map((categoryId) => {
    let category = dataStore.categoryDictionary[categoryId]
    const amount = dictionary[categoryId]
    const percent = (amount / maxAmount) * 100
    return {
      category: category,
      label: category ? Category.getDisplayName(category) : t('not_set'),
      value: formatNumberForDashboard(amount),
      percent: percent,
    }
  })
  return bars.sort((a, b) => b.percent - a.percent).slice(0, 15)
})

const getBarColor = (bar) => {
  return '#4DB6AC'
}

const actionSheet = useActionSheet()
const onShowActionSheet = ({ category }) => {
  actionSheet.show([
    { name: 'Edit category', callback: () => onGoToCategory(category) },
    { name: 'Show transactions', callback: () => onGoToTransactions(category) },
  ])
}

const onGoToCategory = async (category) => {
  if (category) {
    await navigateTo(`${RouteConstants.ROUTE_CATEGORY_ID}/${category.id}`)
  }
}

const onGoToTransactions = async (category) => {
  const startDate = DateUtils.dateToString(dataStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dataStore.dashboardDateEnd)
  let excludedUrl = getExcludedTransactionUrl()

  if (!category) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_category=true&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.transfer.code}${excludedUrl}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?category_id=${category.id}&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.transfer.code}${excludedUrl}`)
}
</script>
