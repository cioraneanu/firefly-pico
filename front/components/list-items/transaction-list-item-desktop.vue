<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <div class="transaction-desktop-row cursor-pointer" :class="cellClass">
      <div class="transaction-desktop-type-dot" :class="typeClass" />

      <div class="transaction-desktop-date line-height-normal">
        <div class="transaction-desktop-date-value">{{ dateFormatted }}</div>
        <div class="transaction-desktop-muted">{{ timeAgo }}</div>
      </div>

      <div class="transaction-desktop-description overflow-hidden line-height-normal">
        <div class="flex-center-vertical gap-1">
          <span class="transaction-desktop-title ellipse-text">{{ description }}</span>
          <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="13" color="#1E88E5" />
        </div>
        <div v-if="notes" class="transaction-desktop-muted transaction-desktop-notes ellipse-text" v-html="notes" />
      </div>

      <div class="transaction-desktop-amount text-right line-height-normal">
        <div class="transaction-desktop-amount-value" :style="amountStyle">{{ transactionAmount }} {{ transactionCurrency }}</div>
        <div v-if="isSplitPayment" class="transaction-desktop-split text-uppercase">{{ $t('split') }}</div>
      </div>

      <div class="transaction-desktop-accounts overflow-hidden">
        <div v-for="account in displayedAccounts" :key="account.id" class="transaction-desktop-account overflow-hidden">
          <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="13" />
          <span class="ellipse-text">{{ Account.getDisplayName(account) }}</span>
        </div>
      </div>

      <div class="transaction-desktop-categories overflow-hidden">
        <div v-if="profileStore.categoriesEnabled" class="transaction-desktop-chips">
          <div v-for="category in categories" :key="category.id" class="transaction-desktop-chip overflow-hidden">
            <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="13" />
            <span class="ellipse-text">{{ Category.getDisplayName(category) }}</span>
          </div>
        </div>
      </div>

      <div class="transaction-desktop-tags overflow-hidden">
        <div v-if="profileStore.tagsEnabled" class="transaction-desktop-chips">
          <div v-for="tag in visibleTags" :key="tag.id" class="transaction-desktop-chip transaction-desktop-chip-outline">
            <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="13" />
            <span class="ellipse-text">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</span>
          </div>

          <div v-if="tags.length > visibleTags.length" class="transaction-desktop-more">+{{ tags.length - visibleTags.length }}</div>
        </div>
      </div>

      <div class="transaction-desktop-budget overflow-hidden">
        <div v-if="profileStore.budgetsEnabled && budget" class="transaction-desktop-chip overflow-hidden">
          <app-icon :icon="TablerIconConstants.budget" :size="13" />
          <span class="ellipse-text">{{ Budget.getDisplayName(budget) }}</span>
        </div>
      </div>
    </div>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import Account from '~/models/Account.js'
import Budget from '~/models/Budget.js'
import Category from '~/models/Category.js'
import Tag from '~/models/Tag.js'
import { useTransactionListItem } from '~/composables/useTransactionListItem.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe.js'

const props = defineProps({
  value: Object,
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
  typeClass,
  visibleTags,
  transactionAmount,
  transactionCurrency,
  dateFormatted,
  timeAgo,
  amountStyle,
} = useTransactionListItem(props)

const onEdit = () => {
  emit('onEdit', props.value)
}

const onDelete = () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
