<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('dashboard.transfers_by_tags.title') }}:</div>
      <div>
        <van-button size="small" @click="onToggleTagMode">{{ tagModeDisplayName }}</van-button>
      </div>
    </div>
    <div class="display-flex flex-column ml-15 mr-15">
      <table>
        <tr v-for="bar in barsList" @click="onShowActionSheet(bar)">
          <td style="width: 1%">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Tag.getIcon(bar.tag) ?? TablerIconConstants.tag" :size="20" />
              <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal :percent="bar.percent" :getBackground="getBarColor"/>
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
import Tag from '~/models/Tag.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'
import { useActionSheet } from '~/composables/useActionSheet.js'

const dataStore = useDataStore()
const { t } = useI18n()

const onToggleTagMode = () => {
  dataStore.dashboard.tagsWidgetModeOnlyRootTag = !dataStore.dashboard.tagsWidgetModeOnlyRootTag
}

const tagModeDisplayName = computed(() => (dataStore.dashboard.tagsWidgetModeOnlyRootTag ? t('dashboard.expenses_by_tags.one_root_tag') : t('dashboard.expenses_by_tags.all_tags')))

const barsList = computed(() => {
  const tagTotalDictionary = dataStore.dashboardTransfersByTag

  const maxAmount = Math.max(...Object.values(tagTotalDictionary))

  const bars = Object.keys(tagTotalDictionary).map((tagId) => {
    const tag = dataStore.tagDictionaryById[tagId]
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

const getBarColor = (bar) => {
  return '#FFD54F'
}

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
  const startDate = DateUtils.dateToString(dataStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dataStore.dashboardDateEnd)
  let excludedUrl = getExcludedTransactionUrl()

  if (!tag) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_tag=true&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.transfer.code}${excludedUrl}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?tag_id=${tag.id}&date_start=${startDate}&date_end=${endDate}&type=${Transaction.types.transfer.code}${excludedUrl}`)
}
</script>
