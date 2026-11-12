<template>
  <d-page :title="$t('todo_page.title')" :description="$t('todo_page.description', { tag: todoTagName })">
    <template #actions>
      <d-button :icon="IconRefresh" :loading="todoStore.isLoading" @click="todoStore.fetchTodo">{{ $t('desktop.refresh') }}</d-button>
    </template>

    <!-- Review controls stay on top while the list scrolls -->
    <section
      v-if="isPanelVisible"
      class="sticky top-3 z-6 flex items-center gap-6 rounded-xl bg-card px-5 py-4 shadow-[0_8px_16px_-12px_rgb(0_0_0/0.25)] ring-1 ring-fg/10"
      :aria-label="$t('todo_page.review_controls')"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <b class="text-[15px] font-semibold leading-5">{{ isDoneView ? $t('todo_page.done_this_session', { count: doneCount }) : $t('todo_page.left_to_review', { count: todoCount }) }}</b>
        <d-progress :value="progress" />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <d-button size="sm" :icon="isDoneView ? IconListCheck : IconHistory" :aria-pressed="isDoneView" :disabled="!isDoneView && doneCount === 0" @click="toggleView">
          {{ isDoneView ? $t('todo_page.to_review_count', { count: todoCount }) : $t('todo_page.done_count', { count: doneCount }) }}
        </d-button>
        <d-button v-if="isDoneView" size="sm" :icon="IconArrowBackUp" @click="onPutBackAll">{{ $t('todo_page.put_all_back') }}</d-button>
        <d-button v-else variant="primary" size="sm" :icon="IconChecks" @click="todoStore.markDone(filtered)">{{ $t('todo_page.mark_all_done') }}</d-button>
      </div>
    </section>

    <div v-if="list.length" class="flex flex-wrap items-center gap-2">
      <d-input v-model="search" :icon="IconSearch" :placeholder="$t('todo_page.search')" clearable class="w-70" />
      <span class="flex-1" />
      <d-checkbox v-if="filtered.length" v-model="isAllSelected" class="px-1 text-dim">{{ $t('todo_page.select_all') }}</d-checkbox>
    </div>

    <section v-if="filtered.length" class="overflow-x-auto rounded-xl bg-card ring-1 ring-fg/10">
      <div role="table" class="min-w-265">
        <template v-for="group in groups" :key="group.label">
          <div v-if="group.label" role="row" class="flex h-9 items-center justify-between border-y border-line bg-soft/55 px-4 text-xs font-medium text-dim first:border-t-0">
            <span>
              <b class="mr-2 font-medium text-fg">{{ group.label }}</b>
              {{ group.relative }}
            </span>
            <app-count-up :value="group.total" class="tabular-nums" />
          </div>
          <div class="divide-y divide-line">
            <d-todo-row
              v-for="transaction in group.items"
              :key="transaction.id"
              v-model:selected="selected[transaction.id]"
              :value="transaction"
              :is-done="isDoneView"
              @edit="navigateTo(`${RouteConstants.ROUTE_TODO}/${transaction.id}`)"
              @done="todoStore.markDone([transaction])"
              @put-back="todoStore.putBack([transaction])"
            />
          </div>
        </template>
      </div>
    </section>

    <section v-else-if="list.length" class="rounded-xl bg-card ring-1 ring-fg/10">
      <d-empty :icon="IconSearchOff" :title="$t('general.list_no_results')" :text="$t('todo_page.no_match')">
        <d-button size="sm" @click="search = ''">{{ $t('general.clear_filters') }}</d-button>
      </d-empty>
    </section>

    <section v-else-if="!tagStore.tagTodo" class="rounded-xl bg-card ring-1 ring-fg/10">
      <d-empty :icon="IconTag" :title="$t('desktop.no_todo_tag')" :text="$t('desktop.todo_hint')">
        <d-button size="sm" :to="RouteConstants.ROUTE_TAG_LIST">{{ $t('tags') }}</d-button>
      </d-empty>
    </section>

    <section v-else-if="isDoneView" class="rounded-xl bg-card ring-1 ring-fg/10">
      <d-empty :icon="IconHistory" :title="$t('todo_page.nothing_done')" :text="$t('todo_page.nothing_done_hint')">
        <d-button size="sm" @click="toggleView">{{ $t('todo_page.back_to_review') }}</d-button>
      </d-empty>
    </section>

    <section v-else-if="!todoStore.isLoading" class="rounded-xl bg-card ring-1 ring-fg/10">
      <d-empty :icon="IconSparkles" :title="$t('todo_page.all_caught_up')" :text="$t('todo_page.all_caught_up_hint')">
        <div class="flex gap-2">
          <d-button v-if="doneCount" size="sm" :icon="IconHistory" @click="toggleView">{{ $t('todo_page.review_done', { count: doneCount }) }}</d-button>
          <d-button size="sm" variant="ghost" :to="RouteConstants.ROUTE_DASHBOARD">{{ $t('todo_page.back_to_dashboard') }}</d-button>
        </div>
      </d-empty>
    </section>

    <!-- Bulk actions for the selected rows -->
    <div v-if="selectedList.length" role="toolbar" class="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-pop p-1.5 shadow-lg ring-1 ring-fg/10">
      <span class="whitespace-nowrap px-2.5 text-sm font-medium">{{ $t('todo_page.selected', { count: selectedList.length }) }}</span>
      <d-button size="sm" variant="ghost" @click="clearSelection">{{ $t('todo_page.clear') }}</d-button>
      <d-button v-if="isDoneView" size="sm" variant="primary" :icon="IconArrowBackUp" @click="onBulk(todoStore.putBack)">{{ $t('todo_page.put_back') }}</d-button>
      <d-button v-else size="sm" variant="primary" :icon="IconChecks" @click="onBulk(todoStore.markDone)">{{ $t('todo_page.mark_done') }}</d-button>
    </div>

    <d-transaction-dialog v-if="route.params.id" :key="route.params.id" :list-route="RouteConstants.ROUTE_TODO" @changed="onChanged" />
  </d-page>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconArrowBackUp, IconChecks, IconHistory, IconListCheck, IconRefresh, IconSearch, IconSearchOff, IconSparkles, IconTag } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'

const route = useRoute()
const todoStore = useTodoStore()
const tagStore = useTagStore()

const isDoneView = ref(false)
const selected = reactive({})

const list = computed(() => (isDoneView.value ? todoStore.doneList : todoStore.todoList))
const todoCount = computed(() => todoStore.todoList.length)
const doneCount = computed(() => todoStore.doneList.length)
const progress = computed(() => (todoStore.totalCount ? Math.round((doneCount.value / todoStore.totalCount) * 100) : 0))
const isPanelVisible = computed(() => (isDoneView.value ? doneCount.value : todoCount.value) > 0)
const todoTagName = computed(() => Tag.getDisplayName(tagStore.tagTodo) ?? 'todo')

const { search, filtered } = useSearch(
  list,
  (transaction) => Transaction.getDescription(transaction),
  (transaction) => Transaction.getNotes(transaction),
  (transaction) => Account.getDisplayName(Transaction.getFirstSplit(transaction)?.accountSource),
  (transaction) => Account.getDisplayName(Transaction.getFirstSplit(transaction)?.accountDestination),
)
const groups = useTransactionGroups(filtered)

const selectedList = computed(() => filtered.value.filter((transaction) => selected[transaction.id]))
const clearSelection = () => Object.keys(selected).forEach((id) => (selected[id] = false))
const isAllSelected = computed({
  get: () => filtered.value.length > 0 && selectedList.value.length === filtered.value.length,
  set: (value) => filtered.value.forEach((transaction) => (selected[transaction.id] = value)),
})

const toggleView = () => {
  clearSelection()
  isDoneView.value = !isDoneView.value
}
const onBulk = async (action) => {
  const transactions = selectedList.value
  clearSelection()
  await action(transactions)
}
const onPutBackAll = async () => {
  await todoStore.putBack(filtered.value)
  isDoneView.value = false
}

const onChanged = (event, response, id) => {
  if (event === useFormEvent.postSave) todoStore.onSaved(todoStore.fromApi(get(response, 'data.data')))
  if (event === useFormEvent.postDelete) todoStore.onDeleted(id)
}

onMounted(todoStore.fetchTodo)
</script>
