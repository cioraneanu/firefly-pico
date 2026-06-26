<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell :class="cellClass">
      <template #title>
        <div class="display-flex transaction-card prevent-select align-items-lg-stretch">
          <div class="second_column flex-1-w">
            <div v-if="isSplitPayment && props.isDetailedMode" class="mt-1 display-flex">
              <transaction-split-badge />
            </div>

            <div class="flex-center-vertical gap-1">
              <div v-if="description" class="list-item-title max-2-lines word-break-word">{{ description }}</div>
              <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="20" color="#1E88E5" />
            </div>

            <div class="flex-column" :style="getStyleForField(transactionListField.accounts)">
              <div v-for="displayedAccount in displayedAccounts" :key="displayedAccount.id" class="list-item-subtitle">
                <app-icon :icon="Account.getIcon(displayedAccount) ?? TablerIconConstants.account" :size="20" />
                <span>{{ Account.getDisplayName(displayedAccount) }}</span>
              </div>
            </div>

            <div v-if="profileStore.categoriesEnabled && categories && props.isDetailedMode" class="list-item-subtitle gap-2" :style="getStyleForField(transactionListField.category)">
              <div v-for="category in categories" :key="category.id">
                <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="20" />
                {{ Category.getDisplayName(category) }}
              </div>
            </div>

            <div v-if="notes && props.isDetailedMode" class="list-item-subtitle" :style="getStyleForField(transactionListField.notes)">
              <app-icon :icon="TablerIconConstants.fieldText1" :size="20" />
              <span class="notes-markdown max-2-lines word-break-word" v-html="notes" />
            </div>

            <div v-if="profileStore.tagsEnabled && tags && props.isDetailedMode" class="tags-container" :style="getStyleForField(transactionListField.tags)">
              <div v-for="tag in visibleTags" :key="tag.id" class="tag">
                <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
                <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
              </div>
            </div>

            <div v-if="profileStore.budgetsEnabled && budget && props.isDetailedMode" class="list-item-subtitle" :style="getStyleForField(transactionListField.budget)">
              <app-icon :icon="TablerIconConstants.budget" :size="20" />
              {{ Budget.getDisplayName(budget) }}
            </div>
          </div>

          <div class="third_column">
            <div class="font-weight-700 text-size-14" :style="amountStyle">{{ transactionAmount }} {{ transactionCurrency }}</div>

            <transaction-list-item-hero-icon v-if="props.isDetailedMode" :value="props.value" />

            <div class="display-flex flex-column align-items-end text-size-12 gap-1 line-height-normal mt-1">
              <div>{{ dateFormatted }}</div>
              <div class="text-muted">{{ timeAgo }}</div>
            </div>

            <div class="flex-center-vertical text-muted text-size-12 gap-1" />
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import Category from '@/models/Category.js'
import Budget from '~/models/Budget.js'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '@/models/Tag.js'
import Account from '~/models/Account.js'
import TransactionListItemHeroIcon from '~/components/list-items/transaction-list-item-hero-icon.vue'
import TransactionSplitBadge from '~/components/transaction/transaction-split-badge.vue'
import { transactionListField } from '~/constants/TransactionConstants.js'
import { useTransactionListItem } from '~/composables/useTransactionListItem.js'

const props = defineProps({
  value: Object,
  isDetailedMode: {
    default: true,
  },
})

const emit = defineEmits(['onEdit', 'onDelete'])

const {
  profileStore,
  isSplitPayment,
  displayedAccounts,
  description,
  hasAttachments,
  categories,
  notes,
  tags,
  budget,
  cellClass,
  visibleTags,
  transactionAmount,
  transactionCurrency,
  dateFormatted,
  timeAgo,
  getStyleForField,
  amountStyle,
} = useTransactionListItem(props)

const onEdit = async () => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
