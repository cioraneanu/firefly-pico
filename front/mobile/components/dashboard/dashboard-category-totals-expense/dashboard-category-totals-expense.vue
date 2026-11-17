<template>
  <app-card :title="$t('dashboard.expenses_by_categories')" :form="false">
    <template #actions>
      <button type="button" class="mx-ib sm" :aria-label="$t('dash_page.card_options')" @click="showOptions = true">
        <app-icon :icon="TablerIconConstants.settings" :size="16" :stroke="2" />
      </button>
    </template>

    <dashboard-bar-list :bars="barsList" :get-icon="(bar) => Category.getIcon(bar.category) ?? TablerIconConstants.category" @select="onShowActions" />
  </app-card>

  <app-sheet v-model:show="showOptions" :title="$t('dash_page.card_options')">
    <div class="mx-form">
      <div class="mx-f">
        <div class="mx-l">{{ $t('amount') }}</div>
        <app-tabs v-model="dashboardStore.widgetsNetAmountMode" :items="amountModeTabs" />
      </div>
    </div>
  </app-sheet>

  <dashboard-item-sheet
    v-model:show="showActions"
    :title="selectedBar?.label"
    :description="selectedBar ? `${selectedBar.value} · ${rangeTitle}` : null"
    :edit-label="selectedBar?.category ? $t('category_page.title_edit') : null"
    @edit="onGoToCategory(selectedBar.category)"
    @transactions="onGoToTransactions(selectedBar.category)"
  />
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import Transaction from '~/core/models/Transaction.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Category from '~/core/models/Category.js'

import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const { t } = useI18n()
const showOptions = ref(false)

const amountModeTabs = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const { expensesByCategory: barsList } = useDashboardBars()
const { rangeTitle } = useDashboardSummary()
const links = useDashboardLinks()

const showActions = ref(false)
const selectedBar = ref(null)
const onShowActions = (bar) => {
  selectedBar.value = bar
  showActions.value = true
}

const onGoToCategory = async (category) => {
  if (category) {
    await navigateTo(`${RouteConstants.ROUTE_CATEGORY_ID}/${category.id}`)
  }
}
const onGoToTransactions = (category) => navigateTo(links.byCategory(category, dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
</script>
