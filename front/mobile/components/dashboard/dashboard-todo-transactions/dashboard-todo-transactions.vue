<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex items-center">
      <div class="flex-1">{{ $t('settings.dashboard.cards.todo_transactions') }}:</div>

      <van-button v-if="tagStore.tagTodo" size="small" @click="onGoToTodos">{{ $t('todo') }}: {{ dashboardStore.transactionsWithTodo.length }}</van-button>
      <div v-else class="flex items-center gap-1">
        <span class="text-muted text-10 font-normal"> No "todo" tag </span>
        <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
      </div>
    </div>
    <div>
      <transaction-list-item v-for="transaction in dashboardStore.transactionsWithTodo" :key="transaction.id" :value="transaction" :is-detailed-mode="false" @on-edit="onEditTransaction" />
    </div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import { TUTORIAL_CONSTANTS } from '~/core/constants/TutorialConstants.js'

const dashboardStore = useDashboardStore()
const tagStore = useTagStore()

const onEditTransaction = async (transaction) => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}/${transaction.id}`)
}

const links = useDashboardLinks()
const onGoToTodos = () => links.todo() && navigateTo(links.todo())
</script>
