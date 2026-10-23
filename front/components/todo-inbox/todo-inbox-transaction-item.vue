<template>
  <div
    ref="itemElement"
    class="todo-inbox-item"
    :class="{ 'todo-inbox-item-desktop': appStore.isDesktopLayout, 'todo-inbox-item-expanded': props.isExpanded }"
    :data-todo-id="props.value.id"
  >
    <div v-if="props.receipt || props.isProcessing || props.isQueued" class="todo-inbox-receipt" :aria-busy="props.isProcessing || props.isQueued">
      <van-loading v-if="props.isProcessing" size="16" />
      <app-icon v-else :icon="props.isQueued ? TablerIconConstants.order : TablerIconConstants.booleanCheckOn" :size="17" />
      <span class="todo-inbox-receipt-description ellipse-text" :title="description">{{ description }}</span>
      <span class="todo-inbox-receipt-amount">{{ amounts.map((amount) => amount.text).join(' · ') }}</span>
      <span class="todo-inbox-receipt-label" role="status">
        {{ $t(props.isProcessing ? (props.receipt ? 'todo_inbox.restoring' : 'todo_inbox.saving') : props.isQueued ? 'todo_inbox.queued' : (props.receipt?.messageKey ?? 'todo_inbox.done')) }}
      </span>
      <van-button v-if="props.receipt?.journalIds.length && !props.isProcessing" size="mini" plain class="todo-inbox-action" @click.stop="emit('undo', props.value)">
        {{ $t('todo_inbox.undo') }}
      </van-button>
    </div>
    <template v-else>
      <div :id="`todo-row-${props.value.id}`" ref="reviewRow" class="todo-inbox-review-row" :class="{ 'transaction-desktop-list': appStore.isDesktopLayout }">
        <transaction-list-item-desktop v-if="appStore.isDesktopLayout" :value="props.value" :review-display="reviewDisplay" safe-notes :can-delete="false" @on-edit="emit('edit', props.value)" />
        <transaction-list-item v-else :value="props.value" :review-display="reviewDisplay" safe-notes :can-delete="false" @on-edit="emit('edit', props.value)" />
      </div>
      <div v-if="props.error" class="todo-inbox-item-error" role="alert">
        <span>{{ props.error }}</span>
        <van-button size="mini" plain type="danger" @click.stop="emit('retry', props.value)">{{ $t('todo_inbox.retry') }}</van-button>
      </div>
      <div v-if="reviewDisplay && hasReviewContext" class="todo-inbox-review-context">
        <span v-if="splits.length > 1">{{ $t('transaction.split_count', { count: splits.length }) }}</span>
        <span v-if="profileStore.categoriesEnabled && !firstSplit.category && !firstSplit.category_name && firstSplit.type?.fireflyCode !== 'transfer'">
          <app-icon :icon="TablerIconConstants.category" :size="14" />{{ $t('category') }}: {{ $t('todo_inbox.none') }}
        </span>
        <span v-if="profileStore.recurringTransactionsEnabled && (firstSplit.subscription_name || firstSplit.bill_name)">
          <app-icon :icon="TablerIconConstants.recurringTransaction" :size="14" />{{ firstSplit.subscription_name || firstSplit.bill_name }}
        </span>
        <span v-for="field in extraDates" :key="field.code"><app-icon :icon="field.icon" :size="14" />{{ $t(field.t) }}: {{ DateUtils.dateToUI(firstSplit[field.code]) }}</span>
        <span v-if="foreignAmount"
          ><app-icon :icon="TablerIconConstants.currency" :size="14" />{{ formatAmount(foreignAmount, locale) }} {{ firstSplit.foreign_currency_symbol ?? firstSplit.foreign_currency_code }}</span
        >
      </div>
      <div class="todo-inbox-item-actions">
        <van-button
          v-if="needsExpansion"
          size="small"
          plain
          class="todo-inbox-action"
          :aria-expanded="props.isExpanded"
          :aria-controls="`todo-row-${props.value.id}`"
          @click.stop="emit('toggle', props.value)"
        >
          <app-icon :icon="props.isExpanded ? TablerIconConstants.upArrow : TablerIconConstants.downArrow" :size="16" />
          {{ props.isExpanded ? $t('todo_inbox.collapse') : $t('todo_inbox.details') }}
        </van-button>
        <div class="flex-1" />
        <van-button size="small" plain class="todo-inbox-action todo-inbox-done" @click.stop="emit('done', props.value)">
          <app-icon :icon="TablerIconConstants.booleanCheckOn" :size="17" />
          {{ $t('todo_inbox.done') }}
        </van-button>
      </div>
    </template>
    <div v-if="props.receipt && props.error" class="todo-inbox-item-error" role="alert">
      <span>{{ props.error }}</span>
      <van-button size="mini" plain type="danger" :disabled="props.isProcessing" @click.stop="emit('undo', props.value)">{{ $t('todo_inbox.retry') }}</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { transactionExtraDateFieldList } from '~/constants/TransactionConstants.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import { formatAmount } from '~/utils/AmountUtils.js'
import { getTodoReviewAmounts, hasClippedTodoReviewContent, hasHiddenTodoReviewData } from '~/utils/TodoReviewUtils.js'

const props = defineProps({
  value: { type: Object, required: true },
  isExpanded: { type: Boolean, default: false },
  isProcessing: { type: Boolean, default: false },
  isQueued: { type: Boolean, default: false },
  error: { type: String, default: null },
  receipt: { type: Object, default: null },
})
const emit = defineEmits(['edit', 'toggle', 'done', 'undo', 'retry', 'expansion'])
const appStore = useAppStore()
const profileStore = useProfileStore()
const { locale } = useI18n()
const splits = computed(() => Transaction.getSplits(props.value))
const firstSplit = computed(() => splits.value[0] ?? {})
const extraDates = computed(() => transactionExtraDateFieldList.filter((field) => firstSplit.value[field.code]))
const foreignAmount = computed(() => firstSplit.value.amountForeign ?? firstSplit.value.foreign_amount)
const hasReviewContext = computed(
  () =>
    splits.value.length > 1 ||
    (profileStore.categoriesEnabled && !firstSplit.value.category && !firstSplit.value.category_name && firstSplit.value.type?.fireflyCode !== 'transfer') ||
    (profileStore.recurringTransactionsEnabled && (firstSplit.value.subscription_name || firstSplit.value.bill_name)) ||
    extraDates.value.length > 0 ||
    Boolean(foreignAmount.value),
)
const reviewDisplay = computed(() => appStore.isDesktopLayout || props.isExpanded)
const description = computed(() => Transaction.getDescription(props.value))
const amounts = computed(() => getTodoReviewAmounts(splits.value, locale.value))
const itemElement = ref(null)
const reviewRow = ref(null)
const isClipped = ref(false)
const needsExpansion = computed(
  () => props.isExpanded || (appStore.isDesktopLayout ? isClipped.value : hasHiddenTodoReviewData(splits.value, transactionExtraDateFieldList, profileStore) || isClipped.value),
)
let resizeObserver

const measure = () => {
  if (props.receipt || props.isProcessing || props.isQueued) return
  isClipped.value = hasClippedTodoReviewContent(reviewRow.value)
}

watch(needsExpansion, (canExpand) => emit('expansion', props.value, canExpand), { immediate: true })

onMounted(() => {
  resizeObserver = new ResizeObserver(measure)
  if (itemElement.value) resizeObserver.observe(itemElement.value)
  nextTick(measure)
})
onUpdated(measure)
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  emit('expansion', props.value, false)
})
</script>
