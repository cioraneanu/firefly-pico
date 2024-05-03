<template>
  <van-cell-group inset style="overflow: auto">
    <div class="van-cell-group-title">Expenses by tags:</div>
    <div class="display-flex flex-column ml-15 mr-15">
      <table>

        <tr v-for="bar in barsList" @click="onClick(bar)">

          <td style="width: 1%;">
            <div class="flex-center-vertical gap-1 my-1">
              <app-icon :icon="Tag.getIcon(bar.tag)" :size="20"/>
              <span class="text-size-12 font-weight-400">{{ bar.label }}</span>
            </div>
          </td>

          <td>
            <bar-chart-item-horizontal
                :percent="bar.percent"

            />
          </td>

          <td style="width: 1%;">
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

const dataStore = useDataStore()

const barsList = computed(() => {

  let tagTotalDictionary = dataStore.transactionsListExpense.reduce((result, transaction) => {
    let targetTag = Transaction.getTags(transaction).find(tag => get(tag, 'attributes.parent_id') === null)
    let tagId = get(targetTag, 'id', 0)

    let amount = Transaction.getAmount(transaction)
    let oldTotal = get(result, tagId, 0)
    result[tagId] = oldTotal + amount
    return result
  }, {})

  let maxAmount = Math.max(...Object.values(tagTotalDictionary))

  let bars = Object.keys(tagTotalDictionary).map(tagId => {
    let tag = dataStore.tagDictionaryById[tagId]
    const amount = tagTotalDictionary[tagId].toFixed(0)
    const percent = (amount / maxAmount) * 100
    return {
      tag: tag,
      tag_id: tagId,
      label: tag ? Tag.getDisplayName(tag) : 'Not set',
      value: amount,
      percent: percent,
    }
  })
  return bars.sort((a, b) => b.percent - a.percent).slice(0, 15)
})

const onClick = async (bar) => {
  const startDate = DateUtils.dateToString(dataStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dataStore.dashboardDateEnd)

  let tagId = get(bar, 'tag_id')
  if (!tagId) {
    await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?without_tag=true&date_start=${startDate}&date_end=${endDate}`)
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?tag_id=${bar.tag_id}&date_start=${startDate}&date_end=${endDate}`)
}


</script>