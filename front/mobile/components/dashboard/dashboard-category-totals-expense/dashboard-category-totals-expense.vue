<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex items-center">
      <div class="flex-1">{{ $t('dashboard.expenses_by_categories') }}:</div>
      <van-popover v-model:show="showOptionsPopover" placement="bottom-end">
        <div class="flex flex-col gap-2 p-2.5">
          <div class="flex flex-col gap-1">
            <div class="text-12 font-semibold text-muted">{{ $t('amount') }}</div>
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
    <div class="flex flex-col ml-3.75 mr-3.75">
      <table>
        <tr v-for="bar in barsList" :key="bar.category?.id ?? 'not-set'" class="cursor-pointer" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex items-center gap-1 my-1">
              <app-icon :icon="Category.getIcon(bar.category) ?? TablerIconConstants.category" :size="20" />
              <span class="text-12 font-normal flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" :get-background="getBarColor" />
          </td>

          <td style="width: 1%">
            <div class="flex flex-col">
              <span class="text-12 font-normal">{{ bar.value }}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import Transaction from '~/core/models/Transaction.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Category from '~/core/models/Category.js'
import { useActionSheet } from '~/mobile/composables/useActionSheet.js'

import { useCategoryStore } from '~/core/stores/categoryStore'
import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const { t } = useI18n()
const showOptionsPopover = ref(false)

const amountModeTabs = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const { expensesByCategory: barsList } = useDashboardBars()
const links = useDashboardLinks()

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
const onGoToTransactions = (category) => navigateTo(links.byCategory(category, dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
</script>
