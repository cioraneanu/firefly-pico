<template>
  <app-card :title="$t('dashboard.transfers_by_categories')" :form="false">
    <dashboard-bar-list :bars="barsList" :get-icon="(bar) => Category.getIcon(bar.category) ?? TablerIconConstants.category" @select="onShowActions" />
  </app-card>

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

const { transfersByCategory: barsList } = useDashboardBars()
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

const onGoToTransactions = (category) => navigateTo(links.byCategory(category, Transaction.types.transfer))
</script>
