<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('dashboard.expenses_by_tags.title') }}:</div>
      <van-popover v-model:show="showOptionsPopover" placement="bottom-end">
        <div class="display-flex flex-column gap-2 p-10">
          <div class="display-flex flex-column gap-1">
            <div class="text-size-12 font-weight-600 text-muted">{{ $t('tags') }}</div>
            <app-tabs v-model="dashboardStore.tagsWidgetModeOnlyRootTag" :items="tagModeTabs" />
          </div>
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
        <tr v-for="bar in barsList" :key="bar.tag_id" class="cursor-pointer" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Tag.getIcon(bar.tag) ?? TablerIconConstants.tag" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" />
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
import Tag from '~/models/Tag.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'
import { useActionSheet } from '~/composables/useActionSheet.js'

const dashboardStore = useDashboardStore()
const tagStore = useTagStore()
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

const barsList = computed(() => {
  const tagTotalDictionary = dashboardStore.dashboardExpensesByTag

  const maxAmount = Math.max(...Object.values(tagTotalDictionary))

  const bars = Object.keys(tagTotalDictionary).map((tagId) => {
    const tag = tagStore.tagDictionaryById[tagId]
    const amount = tagTotalDictionary[tagId]
    const percent = (amount / maxAmount) * 100
    return {
      tag: tag,
      tag_id: tagId,
      label: tag ? Tag.getDisplayNameEllipsized(tag) : t('not_set'),
      value: formatNumberForDashboard(amount),
      percent: percent,
    }
  })
  return bars.sort((a, b) => b.percent - a.percent).slice(0, 15)
})

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

const onGoToTransactions = async (tag) => {
  const startDate = DateUtils.dateToString(dashboardStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dashboardStore.dashboardDateEnd)
  const excludedUrl = getExcludedTransactionUrl()
  const typeParam = dashboardStore.widgetsNetAmountMode ? '' : `&type=${Transaction.types.expense.code}`

  if (!tag) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_tag=true&date_start=${startDate}&date_end=${endDate}${typeParam}${excludedUrl}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?tag_id=${tag.id}&date_start=${startDate}&date_end=${endDate}${typeParam}${excludedUrl}`)
}
</script>
