<template>
  <div class="app-form todo-inbox-page" :class="{ empty: showEmptyState || !hasMarkerConfiguration }">
    <app-top-toolbar>
      <template v-if="hasMarkerConfiguration" #right>
        <div class="todo-inbox-page-actions">
          <van-button size="small" plain class="todo-inbox-action" :aria-label="$t('filters.transaction_filters')" :disabled="isLoading || isListLocked" @click="dateFilters?.show()">
            <app-icon :icon="TablerIconConstants.search" :size="17" />
            <span v-if="appStore.isDesktopLayout">{{ $t('filters.transaction_filters') }}</span>
          </van-button>
          <van-button v-if="hasExpandableItems && appStore.isDesktopLayout" size="small" plain class="todo-inbox-action" :disabled="isLoading" @click="toggleAllExpanded">
            <app-icon :icon="allExpanded ? TablerIconConstants.upArrow : TablerIconConstants.downArrow" :size="16" />
            {{ $t(allExpanded ? 'todo_inbox.collapse_all' : 'todo_inbox.expand_all') }}
          </van-button>
          <van-button
            v-if="appStore.isDesktopLayout"
            size="small"
            plain
            class="todo-inbox-action"
            :disabled="isLoading || activeItems.length === 0 || isAnyItemProcessing"
            :loading="isBatchRunning"
            @click="markLoadedDone"
          >
            <app-icon :icon="TablerIconConstants.booleanCheckOn" :size="17" />
            {{ $t('todo_inbox.mark_loaded_done') }}
          </van-button>
        </div>
      </template>
    </app-top-toolbar>

    <empty-list v-if="!hasMarkerConfiguration" :title="$t('todo_inbox.marker_not_configured')" :subtitle="$t('todo_inbox.marker_not_configured_help')">
      <template #action>
        <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
      </template>
    </empty-list>

    <template v-else>
      <van-cell-group v-if="!appStore.isDesktopLayout" inset class="todo-inbox-controls">
        <div class="todo-inbox-page-actions">
          <van-button v-if="hasExpandableItems" size="small" plain class="todo-inbox-action" :disabled="isLoading" @click="toggleAllExpanded">
            <app-icon :icon="allExpanded ? TablerIconConstants.upArrow : TablerIconConstants.downArrow" :size="16" />
            {{ $t(allExpanded ? 'todo_inbox.collapse_all' : 'todo_inbox.expand_all') }}
          </van-button>
          <van-button size="small" plain class="todo-inbox-action" :disabled="isLoading || activeItems.length === 0 || isAnyItemProcessing" :loading="isBatchRunning" @click="markLoadedDone">
            <app-icon :icon="TablerIconConstants.booleanCheckOn" :size="17" />
            {{ $t('todo_inbox.mark_loaded_done') }}
          </van-button>
        </div>
      </van-cell-group>

      <div v-if="batchProgress" class="todo-inbox-status">
        {{
          $t('todo_inbox.batch_progress', {
            processed: batchProgress.processed,
            total: batchProgress.total,
            successful: batchProgress.successful,
            failed: batchProgress.failed,
          })
        }}
      </div>
      <div v-else-if="batchResult" class="todo-inbox-status">
        {{ $t('todo_inbox.batch_result', { successful: batchResult.successful, failed: batchResult.failed }) }}
      </div>

      <div v-if="loadError" class="todo-inbox-load-error">
        <app-icon :icon="TablerIconConstants.close" :size="20" />
        <span>{{ loadError }}</span>
        <van-button size="small" plain type="danger" :loading="isLoading" @click="retryLoad()">{{ $t('todo_inbox.retry') }}</van-button>
      </div>

      <empty-list v-else-if="showEmptyState" :title="$t('todo_inbox.empty')" :subtitle="$t('todo_inbox.empty_help')" />

      <van-pull-refresh v-model="isRefreshing" :disabled="isLoading || isListLocked || dateFilterOpen" @refresh="refreshList()">
        <van-list :loading="isLoading" :finished="isFinished || isListLocked || dateFilterOpen || !!loadError" :immediate-check="false" @load="onLoadMore">
          <div v-if="items.length > 0" class="todo-inbox-list-wrapper">
            <div ref="listElement" class="todo-inbox-list" :inert="isLoading" :aria-busy="isLoading">
              <todo-inbox-transaction-item
                v-for="item in items"
                :key="item.id"
                :value="item"
                :is-expanded="expandedIds.has(String(item.id))"
                :is-processing="getState(item.id).isProcessing"
                :is-queued="getState(item.id).isQueued"
                :error="getState(item.id).error"
                :receipt="receiptById[String(item.id)]"
                @edit="openEditor"
                @toggle="toggleExpanded"
                @expansion="setExpandable"
                @done="onDone"
                @retry="onDone"
                @undo="onUndo"
              />
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
      <transaction-filters ref="dateFilters" v-model="filters" dates-only @update:show="dateFilterOpen = $event" />
    </template>

    <app-popup :show="editorOpen" :close-on-click-overlay="false" :popup-style="editorPopupStyle" @click-overlay="closeEditor" @update:show="onEditorVisibilityChange">
      <div class="todo-inbox-editor-header">
        <strong>{{ $t(editorItem && Transaction.isSplitPayment(editorItem) ? 'transaction.title_split_details' : 'transaction.title_edit_transaction') }}</strong>
        <van-button size="small" plain class="todo-inbox-action" :disabled="editorSaving || editorLoading" @click="closeEditor">{{ $t('todo_inbox.close_editor') }}</van-button>
      </div>
      <div class="todo-inbox-editor-body" :inert="editorSaving">
        <van-loading v-if="editorLoading" class="todo-inbox-editor-loading" />
        <transaction-form v-else-if="editorItem" ref="editorForm" v-model="editorItem" :disabled="editorSaving || editorUnconfirmed" @submit="onEditorSave" />
      </div>
      <div v-if="editorItem || editorError" class="todo-inbox-editor-footer">
        <div v-if="editorError" class="todo-inbox-item-error" role="alert">{{ editorError }}</div>
        <van-button v-if="editorItem && !Transaction.isSplitPayment(editorItem)" block type="primary" :loading="editorSaving" :disabled="editorUnconfirmed" @click="editorForm?.submit()">{{
          $t('save')
        }}</van-button>
      </div>
    </app-popup>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTodoInbox } from '~/composables/useTodoInbox.js'
import { useToolbar } from '~/composables/useToolbar.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import UIUtils from '~/utils/UIUtils.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getActiveFilters, getFiltersFromURL, saveToUrl } from '~/utils/FilterUtils.js'
import { getTodoFilterDateRange } from '~/utils/TodoTransactionUtils.js'

const appStore = useAppStore()
const profileStore = useProfileStore()
const { t } = useI18n()
const {
  items,
  receiptById,
  activeItems,
  remainingCount,
  markerName,
  hasMarkerConfiguration,
  expandedIds,
  hasExpandableItems,
  allExpanded,
  setExpandable,
  toggleAllExpanded,
  dateRange,
  isFinished,
  isRefreshing,
  isLoading,
  isLoaded,
  loadError,
  isListLocked,
  isAnyItemProcessing,
  isBatchRunning,
  batchProgress,
  batchResult,
  getState,
  loadMore,
  retryLoad,
  refreshList,
  editorOpen,
  editorItem,
  editorSaving,
  editorLoading,
  editorError,
  editorUnconfirmed,
  openEditor,
  saveEditor,
  closeEditor,
  toggleExpanded,
  doneItem,
  undoItem,
  markLoadedDone,
} = useTodoInbox()

const showEmptyState = computed(() => isLoaded.value && !isLoading.value && !loadError.value && items.value.length === 0)
const listElement = ref(null)
const editorForm = ref(null)
const editorPopupStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  height: appStore.isDesktopLayout ? 'min(90vh, 780px)' : '94%',
  maxHeight: '94vh',
  width: appStore.isDesktopLayout ? 'min(940px, 92vw)' : undefined,
  padding: 0,
}))
watch(
  () => items.value.map((item) => ({ id: String(item.id), pending: getState(item.id).isProcessing || getState(item.id).isQueued })),
  async (current, previous) => {
    const settledIds = previous.filter((item) => item.pending && !current.find((next) => next.id === item.id)?.pending).map((item) => item.id)
    if (!settledIds.length || !listElement.value) return
    const anchor = [...listElement.value.children].find(
      (element) => !settledIds.includes(element.dataset.todoId) && element.getBoundingClientRect().bottom > 0 && element.getBoundingClientRect().top < window.innerHeight,
    )
    if (!anchor) return
    const top = anchor.getBoundingClientRect().top
    await nextTick()
    if (anchor.isConnected) window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' })
  },
)
const dateRangeLabel = computed(
  () =>
    `${DateUtils.stringFromTo(dateRange.value.start, DateUtils.FORMAT_ENGLISH_DATE, profileStore.dateFormat)}–${DateUtils.stringFromTo(dateRange.value.end, DateUtils.FORMAT_ENGLISH_DATE, profileStore.dateFormat)}`,
)
const toolbarSubtitle = computed(() => (hasMarkerConfiguration.value ? `${markerName.value} · ${dateRangeLabel.value} · ${t('todo_inbox.remaining_items', { count: remainingCount.value })}` : null))

const onDone = (item) => doneItem(item).catch(() => {})
const onUndo = (item) => undoItem(item).catch(() => {})
const onEditorVisibilityChange = (show) => {
  if (!show) closeEditor()
}
const onEditorSave = async () => {
  const row = listElement.value?.querySelector(`[data-todo-id="${editorItem.value?.id}"]`)
  const anchor = row?.nextElementSibling
  const top = anchor?.getBoundingClientRect().top
  if (await saveEditor()) {
    await nextTick()
    if (anchor?.isConnected && top > 0 && top < window.innerHeight) window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' })
  }
}

useToolbar().init({
  title: t('todo_inbox.title'),
  subtitle: toolbarSubtitle,
  backRoute: RouteConstants.ROUTE_DASHBOARD,
})

const dateFilters = ref(null)
const dateFilterOpen = ref(false)
const onLoadMore = () => {
  if (!dateFilterOpen.value) return loadMore()
}
const filters = ref({ dateStart: DateUtils.stringToDate(dateRange.value.start), dateEnd: DateUtils.stringToDate(dateRange.value.end) })
watch(filters, async (selection) => {
  let range
  try {
    range = getTodoFilterDateRange(selection)
  } catch {
    UIUtils.showToastError(t('todo_inbox.invalid_dates'))
    return
  }
  if (await refreshList(range)) {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
})
const dateFilterDefinitions = [TransactionFilterUtils.filters.dateAfter, TransactionFilterUtils.filters.dateBefore]
watch(dateRange, (range) => saveToUrl(getActiveFilters(dateFilterDefinitions, { dateStart: DateUtils.stringToDate(range.start), dateEnd: DateUtils.stringToDate(range.end) })))
onMounted(async () => {
  const selection = getFiltersFromURL(dateFilterDefinitions)
  try {
    getTodoFilterDateRange(selection)
  } catch {
    UIUtils.showToastError(t('todo_inbox.invalid_dates'))
    await refreshList()
    return
  }
  if (selection.dateStart || selection.dateEnd) {
    filters.value = { ...filters.value, ...selection }
  } else {
    await refreshList()
  }
})
</script>
