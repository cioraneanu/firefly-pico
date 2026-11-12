<template>
  <div
    role="row"
    :class="[
      'relative grid min-h-14 grid-cols-[3rem_minmax(11rem,1fr)_minmax(13rem,1.15fr)_minmax(12rem,1.25fr)_8rem_2.5rem] items-center gap-3 py-2 pl-4 pr-2 transition-colors',
      isEditable ? 'cursor-default' : 'cursor-pointer hover:bg-soft/60',
    ]"
    @click="!isEditable && navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}/${value.id}`)"
  >
    <span class="relative w-max">
      <d-tile :icon="icon" />
      <span :class="['absolute -bottom-0.5 -right-0.5 z-1 size-2.5 rounded-full ring-2 ring-card', isTypeExpense ? 'bg-tx-expense' : isTypeIncome ? 'bg-tx-income' : 'bg-tx-transfer']" />
    </span>
    <d-input v-if="isEditable" v-model="edit.description" :aria-label="$t('description')" @change="edit.saveDescription" @keydown.enter="$event.target.blur()" />
    <div v-else class="flex min-w-0 flex-col">
      <span class="flex min-w-0 items-center gap-1.5">
        <span class="truncate font-medium">{{ description }}</span>
        <icon-paperclip v-if="hasAttachments" :size="13" class="shrink-0 text-dim" />
        <icon-arrows-split v-if="isSplitPayment" :size="13" class="shrink-0 text-dim" />
        <d-badge v-if="isTodo" variant="warning" class="h-4.5 text-[11px]">{{ $t('todo') }}</d-badge>
      </span>
      <span v-if="rawNotes && isVisible(transactionListField.notes)" class="truncate text-xs text-dim">{{ rawNotes }}</span>
    </div>
    <span :class="['flex min-w-0 items-center gap-1.5', !isVisible(transactionListField.accounts) && 'invisible']">
      <d-chip v-if="displayedAccounts[0]" :icon="Account.getIcon(displayedAccounts[0]) ?? IconCreditCard">{{ Account.getDisplayName(displayedAccounts[0]) }}</d-chip>
      <icon-arrow-right v-if="displayedAccounts[1]" :size="13" class="shrink-0 text-dim" />
      <d-chip v-if="displayedAccounts[1]" :icon="Account.getIcon(displayedAccounts[1]) ?? IconCreditCard">{{ Account.getDisplayName(displayedAccounts[1]) }}</d-chip>
    </span>
    <span v-if="isEditable" class="flex min-w-0 flex-col gap-1">
      <d-category-select v-if="profileStore.categoriesEnabled" v-model="edit.category" />
      <d-tag-select v-if="profileStore.tagsEnabled" v-model="edit.tags" multiple />
    </span>
    <span v-else class="flex min-w-0 flex-wrap gap-1">
      <d-chip v-for="category in isVisible(transactionListField.category) ? categories : []" :key="category.id" :icon="Category.getIcon(category) ?? IconCategory">{{
        Category.getDisplayName(category)
      }}</d-chip>
      <d-chip v-for="tag in isVisible(transactionListField.tags) ? visibleTags.filter(Boolean) : []" :key="tag.id" :icon="Tag.getIcon(tag) ?? IconTag">{{ Tag.getDisplayName(tag) }}</d-chip>
      <d-chip v-if="budget && isVisible(transactionListField.budget)" :icon="IconBasket">{{ Budget.getDisplayName(budget) }}</d-chip>
    </span>
    <span class="flex flex-col items-end">
      <d-input
        v-if="isEditable"
        v-model="edit.amount"
        type="number"
        step="0.01"
        min="0"
        :suffix="transactionCurrency"
        :aria-label="$t('amount')"
        class="w-full"
        @change="edit.saveAmount"
        @keydown.enter="$event.target.blur()"
      />
      <span v-else :class="['whitespace-nowrap font-medium tabular-nums', isTypeIncome ? 'text-income' : isTypeTransfer ? 'text-dim' : '']">{{ transactionAmount }} {{ transactionCurrency }}</span>
      <span class="text-xs text-dim">{{ profileStore.transactionListGroupByDay ? timeAgo : dateOrTimeAgo }}</span>
    </span>
    <span class="grid place-items-center" @click.stop>
      <icon-loader-2 v-if="edit.isSaving" :size="16" class="d-spin text-dim" />
      <d-menu v-else :items="menu" />
    </span>
  </div>
</template>

<script setup>
import { IconArrowRight, IconBasket, IconCategory, IconCoins, IconCopy, IconCreditCard, IconLoader2, IconPencil, IconTag, IconTemplate, IconTrash } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import { transactionListField } from '~/core/constants/TransactionConstants'
import Account from '~/core/models/Account'
import Budget from '~/core/models/Budget'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'

// editing: the table's edit mode, description / category / tags / amount become inputs that save on change
const props = defineProps({ value: Object, editing: Boolean })
const emit = defineEmits(['delete', 'saved'])
const { t } = useI18n()

const {
  profileStore,
  isTypeExpense,
  isTypeIncome,
  isTypeTransfer,
  isSplitPayment,
  displayedAccounts,
  description,
  hasAttachments,
  categories,
  tags,
  budget,
  visibleTags,
  transactionAmount,
  transactionCurrency,
  timeAgo,
  dateOrTimeAgo,
  getStyleForField,
} = useTransactionListItem(props)

const isEditable = computed(() => props.editing && !isSplitPayment.value)
const edit = reactive(
  useTransactionInlineEdit(
    () => props.value,
    (saved) => emit('saved', saved),
  ),
)

const rawNotes = computed(() => Transaction.getNotes(props.value))
const isVisible = (field) => getStyleForField(field).display !== 'none'
const isTodo = computed(() => tags.value.some((tag) => tag?.attributes?.is_todo))
const icon = computed(() => Category.getIcon(categories.value[0]) ?? Tag.getIcon(tags.value[0]) ?? IconCoins)

const menu = computed(() =>
  [
    { label: t('transaction.title_edit_transaction'), icon: IconPencil, action: () => navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}/${props.value.id}`) },
    !isSplitPayment.value && { label: t('clone'), icon: IconCopy, action: () => navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}?transaction_id=${props.value.id}`) },
    !isSplitPayment.value && {
      label: t('transaction.make_template'),
      icon: IconTemplate,
      action: () => navigateTo(`${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}?transaction_id=${props.value.id}`),
    },
    { label: t('delete'), icon: IconTrash, danger: true, action: () => emit('delete', props.value) },
  ].filter(Boolean),
)
</script>
