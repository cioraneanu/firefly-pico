<template>
  <app-card :title="$t('dashboard.expenses_by_tags.title')" :form="false">
    <template #actions>
      <button type="button" class="mx-ib sm" :aria-label="$t('dash_page.card_options')" @click="showOptions = true">
        <app-icon :icon="TablerIconConstants.settings" :size="16" :stroke="2" />
      </button>
    </template>

    <dashboard-bar-list :bars="barsList" :get-icon="(bar) => Tag.getIcon(bar.tag) ?? TablerIconConstants.tag" @select="onShowActions" />
  </app-card>

  <app-sheet v-model:show="showOptions" :title="$t('dash_page.card_options')">
    <div class="mx-form">
      <div class="mx-f">
        <div class="mx-l">{{ $t('tags') }}</div>
        <app-tabs v-model="dashboardStore.tagsWidgetModeOnlyRootTag" :items="tagModeTabs" />
      </div>
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
    :edit-label="selectedBar?.tag ? $t('tag_page.title_edit') : null"
    @edit="onGoToTag(selectedBar.tag)"
    @transactions="onGoToTransactions(selectedBar.tag)"
  />
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import Transaction from '~/core/models/Transaction.js'
import Tag from '~/core/models/Tag.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const dashboardStore = useDashboardStore()
const { t } = useI18n()
const showOptions = ref(false)

const tagModeTabs = computed(() => [
  { label: t('dashboard.expenses_by_tags.one_root_tag'), value: true },
  { label: t('dashboard.expenses_by_tags.all_tags'), value: false },
])
const amountModeTabs = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const { expensesByTag: barsList } = useDashboardBars()
const { rangeTitle } = useDashboardSummary()
const links = useDashboardLinks()

const showActions = ref(false)
const selectedBar = ref(null)
const onShowActions = (bar) => {
  selectedBar.value = bar
  showActions.value = true
}

const onGoToTag = async (tag) => {
  if (tag) {
    await navigateTo(`${RouteConstants.ROUTE_TAG_ID}/${tag.id}`)
  }
}

const onGoToTransactions = (tag) => navigateTo(links.byTag(tag, dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
</script>
