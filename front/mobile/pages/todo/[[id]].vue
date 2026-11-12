<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <button type="button" class="mx-ib out" :aria-label="$t('desktop.refresh')" @click="onRefresh">
          <span class="grid" :class="{ 'td-spin': todoStore.isLoading }"><app-icon :icon="IconRefresh" :size="18" :stroke="2" /></span>
        </button>
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" finished @refresh="onRefresh">
        <section v-if="isPanelVisible" class="mx-card td-sum td-cp" :aria-label="$t('todo_page.review_controls')">
          <div class="td-sum__t">
            <b>{{ isDoneView ? $t('todo_page.done_this_session', { count: doneCount }) : $t('todo_page.left_to_review', { count: todoCount }) }}</b>
            <span>{{ $t('todo_page.done_of', { done: doneCount, total: todoStore.totalCount }) }}</span>
          </div>
          <div class="td-cp__r">
            <div class="td-trk" role="progressbar" :aria-valuemax="todoStore.totalCount" :aria-valuenow="doneCount"><span :style="{ width: `${progress}%` }" /></div>
            <button type="button" class="mx-btn xs out" :aria-pressed="isDoneView" :disabled="!isDoneView && doneCount === 0" @click="isDoneView = !isDoneView">
              <app-icon :icon="isDoneView ? IconListCheck : IconHistory" :size="14" :stroke="2" />
              <span>{{ isDoneView ? $t('todo_page.to_review_count', { count: todoCount }) : $t('todo_page.done_count', { count: doneCount }) }}</span>
            </button>
          </div>
          <div class="td-cp__a">
            <button type="button" class="mx-btn sm out" :disabled="expandableIds.length === 0" @click="toggleExpandAll">
              <app-icon :icon="isAnyCollapsed ? IconChevronsDown : IconChevronsUp" :size="16" :stroke="2" />
              <span>{{ $t(isAnyCollapsed ? 'todo_page.expand_all' : 'todo_page.collapse_all') }}</span>
            </button>
            <button v-if="isDoneView" type="button" class="mx-btn sm out" @click="onPutBackAll">
              <app-icon :icon="IconArrowBackUp" :size="16" :stroke="2" />
              <span>{{ $t('todo_page.put_all_back') }}</span>
            </button>
            <button v-else type="button" class="mx-btn sm pri" @click="onMarkAllDone">
              <app-icon :icon="IconChecks" :size="16" :stroke="2" />
              <span>{{ $t('todo_page.mark_all_done') }}</span>
            </button>
          </div>
        </section>

        <template v-if="list.length > 0">
          <div class="mx-list">
            <todo-list-item
              v-for="transaction in list"
              :key="transaction.id"
              v-model:expanded="expanded[transaction.id]"
              :value="transaction"
              :is-done="isDoneView"
              @edit="onEdit(transaction)"
              @done="todoStore.markDone([transaction])"
              @put-back="todoStore.putBack([transaction])"
            />
          </div>
          <p class="mx-foot">{{ $t(isDoneView ? 'todo_page.foot_done' : 'todo_page.foot_todo') }}</p>
        </template>

        <div v-else-if="!tagStore.tagTodo" class="mx-card">
          <div class="mx-empty">
            <span class="ic"><app-icon :icon="TablerIconConstants.tag" :size="20" :stroke="2" /></span>
            <b>{{ $t('desktop.no_todo_tag') }}</b>
            <span>{{ $t('desktop.todo_hint') }}</span>
            <button type="button" class="mx-btn out sm" @click="navigateTo(RouteConstants.ROUTE_TAG_LIST)">{{ $t('tags') }}</button>
          </div>
        </div>

        <div v-else-if="isDoneView" class="mx-card">
          <div class="mx-empty">
            <span class="ic"><app-icon :icon="IconHistory" :size="20" :stroke="2" /></span>
            <b>{{ $t('todo_page.nothing_done') }}</b>
            <span>{{ $t('todo_page.nothing_done_hint') }}</span>
            <button type="button" class="mx-btn out sm" @click="isDoneView = false">{{ $t('todo_page.back_to_review') }}</button>
          </div>
        </div>

        <div v-else-if="!todoStore.isLoading" class="mx-card">
          <div class="mx-empty">
            <span class="ic"><app-icon :icon="IconSparkles" :size="20" :stroke="2" /></span>
            <b>{{ $t('todo_page.all_caught_up') }}</b>
            <span>{{ $t('todo_page.all_caught_up_hint') }}</span>
            <button v-if="doneCount > 0" type="button" class="mx-btn out sm" @click="isDoneView = true">
              <app-icon :icon="IconHistory" :size="16" :stroke="2" />
              <span>{{ $t('todo_page.review_done', { count: doneCount }) }}</span>
            </button>
            <button type="button" class="mx-btn ghost sm" @click="navigateTo(RouteConstants.ROUTE_DASHBOARD)">{{ $t('todo_page.back_to_dashboard') }}</button>
          </div>
        </div>
      </app-list>
    </main>

    <todo-edit-sheet v-if="route.params.id" :key="route.params.id" :is-done="isEditingDone" />
  </div>
</template>

<script setup>
import { IconArrowBackUp, IconChecks, IconChevronsDown, IconChevronsUp, IconHistory, IconListCheck, IconRefresh, IconSparkles } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'

// Opening the editor (/todo → /todo/42) keeps this page, its scroll and its expanded rows
definePageMeta({ key: 'todo' })

const route = useRoute()
const todoStore = useTodoStore()
const tagStore = useTagStore()

const isDoneView = ref(false)
const isRefreshing = ref(false)
const expanded = reactive({})

const list = computed(() => withoutDeleted(isDoneView.value ? todoStore.doneList : todoStore.todoList))
const todoCount = computed(() => todoStore.todoList.length)
const doneCount = computed(() => todoStore.doneList.length)
const progress = computed(() => (todoStore.totalCount ? Math.round((doneCount.value / todoStore.totalCount) * 100) : 0))
const isPanelVisible = computed(() => (isDoneView.value ? doneCount.value : todoCount.value) > 0)
const isEditingDone = computed(() => todoStore.doneList.some((transaction) => String(transaction.id) === String(route.params.id)))

// Rows without more to show ignore their expanded flag
const expandableIds = computed(() => list.value.map((transaction) => transaction.id))
const isAnyCollapsed = computed(() => expandableIds.value.some((id) => !expanded[id]))
const toggleExpandAll = () => {
  const value = isAnyCollapsed.value
  expandableIds.value.forEach((id) => (expanded[id] = value))
}

const onEdit = (transaction) => navigateTo(`${RouteConstants.ROUTE_TODO}/${transaction.id}`)
const onMarkAllDone = () => todoStore.markDone(todoStore.todoList)
const onPutBackAll = async () => {
  await todoStore.putBack(todoStore.doneList)
  isDoneView.value = false
}

const onRefresh = async () => {
  isRefreshing.value = true
  await todoStore.fetchTodo()
  isRefreshing.value = false
}

watch(isDoneView, () => document.querySelector('.mx-body')?.scrollTo({ top: 0 }))
onMounted(todoStore.fetchTodo)

const { t } = useI18n()
useToolbar().init({
  title: t('todo_page.title'),
  subtitle: computed(() =>
    isDoneView.value ? t('todo_page.done_this_session_short', { count: doneCount.value }) : todoCount.value ? t('todo_page.tagged_todo', { count: todoCount.value }) : t('todo_page.inbox_zero'),
  ),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})
</script>
