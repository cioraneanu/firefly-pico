<template>
  <app-card :title="$t('dashboard.transfers_by_tags.title')" :form="false">
    <template #actions>
      <button type="button" class="mx-btn xs out" :aria-pressed="dashboardStore.tagsWidgetModeOnlyRootTag" @click="onToggleTagMode">
        <app-icon :icon="IconBinaryTree" :size="14" :stroke="2" />
        <span>{{ tagModeDisplayName }}</span>
      </button>
    </template>

    <dashboard-bar-list :bars="barsList" :get-icon="(bar) => Tag.getIcon(bar.tag) ?? TablerIconConstants.tag" @select="onShowActions" />
  </app-card>

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
import { IconBinaryTree } from '@tabler/icons-vue'

const dashboardStore = useDashboardStore()
const { t } = useI18n()

const onToggleTagMode = () => {
  dashboardStore.tagsWidgetModeOnlyRootTag = !dashboardStore.tagsWidgetModeOnlyRootTag
}

const tagModeDisplayName = computed(() => (dashboardStore.tagsWidgetModeOnlyRootTag ? t('dashboard.expenses_by_tags.one_root_tag') : t('dashboard.expenses_by_tags.all_tags')))

const { transfersByTag: barsList } = useDashboardBars()
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

const onGoToTransactions = (tag) => navigateTo(links.byTag(tag, Transaction.types.transfer))
</script>
