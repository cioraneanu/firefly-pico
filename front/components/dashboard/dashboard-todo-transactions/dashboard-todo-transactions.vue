<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('settings.dashboard.cards.todo_transactions') }}:</div>

      <van-button v-if="tagStore.tagTodo" size="small" @click="onGoToTodos">{{ $t('todo') }}: {{ dashboardStore.transactionsWithTodo.length }}</van-button>
      <div v-else class="flex-center-vertical gap-1">
        <span class="text-muted text-size-10 font-weight-400"> No "todo" tag </span>
        <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
      </div>
    </div>
    <div>
      <transaction-list-item v-for="transaction in dashboardStore.transactionsWithTodo" :key="transaction.id" :value="transaction" :is-detailed-mode="false" @on-edit="onEditTransaction" />
    </div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'
import { get } from 'lodash-es'

const dashboardStore = useDashboardStore()
const tagStore = useTagStore()

const onEditTransaction = async (transaction) => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}/${transaction.id}`)
}

const onGoToTodos = async () => {
  const todoTagId = get(tagStore.tagTodo, 'id')
  if (!todoTagId) {
    return
  }
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?tag_id=${todoTagId}`)
}
</script>
