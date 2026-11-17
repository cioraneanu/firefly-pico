<template>
  <section class="mx-card">
    <div class="mx-card__h">
      <div>
        <h2 class="mx-card__t">{{ $t('settings.dashboard.cards.todo_transactions') }}</h2>
      </div>

      <button v-if="tagStore.tagTodo" type="button" class="mx-btn xs out" @click="onGoToTodos">
        <app-icon :icon="IconListCheck" :size="14" :stroke="2" />
        <span>{{ $t('todo') }}</span>
        <span class="mx-badge pri">{{ todoStore.visibleTodoList.length }}</span>
      </button>
      <div v-else class="flex items-center gap-1">
        <span class="mx-muted text-12">{{ $t('dash_page.no_todo_tag') }}</span>
        <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
      </div>
    </div>

    <div v-if="todoStore.visibleTodoList.length > 0" class="mx-dash-rows">
      <transaction-list-item
        v-for="transaction in todoStore.visibleTodoList.slice(0, 5)"
        :key="transaction.id"
        :value="transaction"
        :is-detailed-mode="false"
        :deletable="false"
        @on-edit="onEditTransaction"
      />
    </div>
    <div v-else class="h-3.5" />
  </section>
</template>
<script setup>
import { IconListCheck } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants.js'
import { TUTORIAL_CONSTANTS } from '~/core/constants/TutorialConstants.js'

const todoStore = useTodoStore()
const tagStore = useTagStore()

const onEditTransaction = async (transaction) => {
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}/${transaction.id}`)
}

const links = useDashboardLinks()
const onGoToTodos = () => links.todo() && navigateTo(links.todo())
</script>
