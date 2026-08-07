<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('dashboard.expenses_by_categories') }}:</div>
      <van-popover v-model:show="showOptionsPopover" placement="bottom-end">
        <div class="display-flex flex-column gap-2 p-10">
          <div class="display-flex flex-column gap-1">
            <div class="text-size-12 font-weight-600 text-muted">{{ $t('amount') }}</div>
            <app-tabs v-model="dashboardStore.widgetsNetAmountMode" :items="amountModeTabs" />
          </div>
        </div>

        <template #reference>
          <button type="button" class="app-button-icon">
            <app-icon :icon="TablerIconConstants.settings" :size="18" />
          </button>
        </template>
      </van-popover>
    </div>
    <div class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="bar in barsList" :key="bar.category?.id ?? 'not-set'" class="cursor-pointer" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Category.getIcon(bar.category) ?? TablerIconConstants.category" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" :get-background="getBarColor" />
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
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Category from '~/models/Category.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'
import { useActionSheet } from '~/composables/useActionSheet.js'

import { useCategoryStore } from '~/stores/categoryStore'
import { useDashboardStore } from '~/stores/dashboardStore'

const categoryStore = useCategoryStore()
const dashboardStore = useDashboardStore()
const { t } = useI18n()
const showOptionsPopover = ref(false)

const amountModeTabs = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const barsList = computed(() => {
  const dictionary = dashboardStore.dashboardExpensesByCategory

  const maxAmount = Math.max(...Object.values(dictionary))

  const bars = Object.keys(dictionary).map((categoryId) => {
    const category = categoryStore.categoryDictionary[categoryId]
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

const getBarColor = () => {
  return '#F06292'
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
  const startDate = DateUtils.dateToString(dashboardStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dashboardStore.dashboardDateEnd)
  const excludedUrl = getExcludedTransactionUrl()
  const typeParam = dashboardStore.widgetsNetAmountMode ? '' : `&type=${Transaction.types.expense.code}`

  if (!category) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_category=true&date_start=${startDate}&date_end=${endDate}${typeParam}${excludedUrl}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?category_id=${category.id}&date_start=${startDate}&date_end=${endDate}${typeParam}${excludedUrl}`)
}
</script>
