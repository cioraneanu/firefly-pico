<template>
  <app-list-item row-class="mx-tx" :clonable="clonable && !isSplitPayment" @on-edit="onEdit" @on-delete="onDelete" @on-clone="onClone">
    <div class="hd">
      <transaction-list-item-hero-icon v-if="props.isDetailedMode" :value="props.value" />
      <transaction-type-dot v-else :transaction-type="firstTransaction?.type" class="mt-1.5" />

      <div class="m">
        <span class="flex items-start gap-1">
          <span class="mx-row__t wrap min-w-0 wrap-anywhere">{{ description }}</span>
          <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="16" :stroke="2" class="mt-0.5 flex-none text-[var(--tr)]" />
        </span>
        <span v-if="isFieldVisible(transactionListField.accounts) && displayedAccounts.length > 0" class="flow">
          <app-icon :icon="Account.getIcon(displayedAccounts[0]) ?? TablerIconConstants.account" :size="13" :stroke="2" />
          <span>{{ accountFlow }}</span>
        </span>
      </div>

      <span class="r">
        <span class="mx-amt mx-money" :class="amountClass">{{ transactionAmount }} {{ transactionCurrency }}</span>
        <span class="mx-date">{{ dateOrTimeAgo }}</span>
      </span>
    </div>

    <div v-if="props.isDetailedMode && hasChips" class="tray">
      <div class="mx-chips">
        <transaction-split-badge v-if="isSplitPayment" />

        <template v-if="isCategoryVisible">
          <span v-for="category in categories" :key="category.id" class="mx-chip" :style="getOrder(transactionListField.category)">
            <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="12" :stroke="2" />
            <span>{{ Category.getDisplayName(category) }}</span>
          </span>
        </template>

        <template v-if="isTagsVisible">
          <span v-for="tag in visibleTags" :key="tag.id" class="mx-chip" :class="{ todo: get(tag, 'attributes.is_todo') }" :style="getOrder(transactionListField.tags)">
            <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="12" :stroke="2" />
            <span>{{ Tag.getDisplayNameEllipsized(tag, 20) }}</span>
          </span>
          <span v-if="tags.length > visibleTags.length" class="mx-chip more" :style="getOrder(transactionListField.tags)">+{{ tags.length - visibleTags.length }}</span>
        </template>

        <span v-if="isBudgetVisible" class="mx-chip" :style="getOrder(transactionListField.budget)">
          <app-icon :icon="TablerIconConstants.budget" :size="12" :stroke="2" />
          <span>{{ Budget.getDisplayName(budget) }}</span>
        </span>
      </div>
    </div>

    <span v-if="props.isDetailedMode && notes && isFieldVisible(transactionListField.notes)" class="nt">
      <app-icon :icon="IconBlockquote" :size="13" :stroke="2" />
      <span class="mx-tx-notes line-clamp-2 wrap-anywhere" v-html="notes" />
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconBlockquote } from '@tabler/icons-vue'
import Account from '~/core/models/Account.js'
import Budget from '~/core/models/Budget.js'
import Category from '~/core/models/Category.js'
import Tag from '~/core/models/Tag.js'
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { transactionListField } from '~/core/constants/TransactionConstants.js'
import { useTransactionListItem } from '~/core/composables/useTransactionListItem.js'

const props = defineProps({
  value: Object,
  isDetailedMode: {
    default: true,
  },
  // Swipe reveals Clone next to Delete
  clonable: { type: Boolean, default: false },
})

const emit = defineEmits(['onEdit', 'onDelete'])

const {
  profileStore,
  firstTransaction,
  isTypeExpense,
  isTypeIncome,
  isTypeTransfer,
  isSplitPayment,
  displayedAccounts,
  description,
  hasAttachments,
  categories,
  notes,
  tags,
  budget,
  visibleTags,
  transactionAmount,
  transactionCurrency,
  dateOrTimeAgo,
  getStyleForField,
} = useTransactionListItem(props)

// The list settings (profileStore.transactionListFieldsConfig) decide which fields show and the order of the chips
const isFieldVisible = (field) => getStyleForField(field).display !== 'none'
const getOrder = (field) => ({ order: getStyleForField(field).order })

const isCategoryVisible = computed(() => profileStore.categoriesEnabled && categories.value.length > 0 && isFieldVisible(transactionListField.category))
const isTagsVisible = computed(() => profileStore.tagsEnabled && tags.value.length > 0 && isFieldVisible(transactionListField.tags))
const isBudgetVisible = computed(() => profileStore.budgetsEnabled && !!budget.value && isFieldVisible(transactionListField.budget))
const hasChips = computed(() => isSplitPayment.value || isCategoryVisible.value || isTagsVisible.value || isBudgetVisible.value)

const accountFlow = computed(() => displayedAccounts.value.map((account) => Account.getDisplayName(account)).join(' → '))
const amountClass = computed(() => ({ e: isTypeExpense.value, i: isTypeIncome.value, t: isTypeTransfer.value }))

const onEdit = () => emit('onEdit', props.value)
const onDelete = () => emit('onDelete', props.value)
const onClone = () => navigateTo(`${RouteConstants.ROUTE_TRANSACTION_ID}?transaction_id=${props.value.id}`)
</script>
