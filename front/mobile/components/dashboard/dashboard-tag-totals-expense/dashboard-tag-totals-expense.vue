<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex items-center">
      <div class="flex-1">{{ $t('dashboard.expenses_by_tags.title') }}:</div>
      <van-popover v-model:show="showOptionsPopover" placement="bottom-end">
        <div class="flex flex-col gap-2 p-2.5">
          <div class="flex flex-col gap-1">
            <div class="text-12 font-semibold text-muted">{{ $t('tags') }}</div>
            <app-tabs v-model="dashboardStore.tagsWidgetModeOnlyRootTag" :items="tagModeTabs" />
          </div>
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
        <tr v-for="bar in barsList" :key="bar.id" class="cursor-pointer" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex items-center gap-1 my-1">
              <app-icon :icon="Tag.getIcon(bar.tag) ?? TablerIconConstants.tag" :size="20" />
              <span class="text-12 font-normal flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" />
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
import Tag from '~/core/models/Tag.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { useActionSheet } from '~/mobile/composables/useActionSheet.js'

const dashboardStore = useDashboardStore()
const { t } = useI18n()
const showOptionsPopover = ref(false)

const tagModeTabs = computed(() => [
  { label: t('dashboard.expenses_by_tags.one_root_tag'), value: true },
  { label: t('dashboard.expenses_by_tags.all_tags'), value: false },
])
const amountModeTabs = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const { expensesByTag: barsList } = useDashboardBars()
const links = useDashboardLinks()

const actionSheet = useActionSheet()
const onShowActionSheet = ({ tag }) => {
  actionSheet.show([
    { name: 'Edit tag', callback: () => onGoToTag(tag) },
    { name: 'Show transactions', callback: () => onGoToTransactions(tag) },
  ])
}

const onGoToTag = async (tag) => {
  if (tag) {
    await navigateTo(`${RouteConstants.ROUTE_TAG_ID}/${tag.id}`)
  }
}

const onGoToTransactions = (tag) => navigateTo(links.byTag(tag, dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
</script>
