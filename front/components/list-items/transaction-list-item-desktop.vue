<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <div class="transaction-list-item-desktop" :class="cellClass">
      <div class="col-type">
        <div class="type-indicator" :class="typeClass" />
      </div>

      <div class="col-date">
        <div class="main-text font-weight-600">{{ dateFormatted }}</div>
        <div class="secondary-text">{{ timeAgo }}</div>
      </div>

      <div class="col-description">
        <div class="flex-center-vertical gap-1">
          <span class="main-text description-text clamp-2">{{ description }}</span>
          <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="14" color="#1E88E5" />
        </div>
        <div v-if="notes" class="secondary-text notes-snippet single-line" v-html="notes" />
      </div>

      <div class="col-accounts">
        <div class="badges-wrapper">
          <div v-for="account in displayedAccounts" :key="account.id" class="standard-badge">
            <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="14" />
            <span class="badge-text">{{ Account.getDisplayName(account) }}</span>
          </div>
        </div>
      </div>

      <div class="col-category">
        <div v-if="profileStore.categoriesEnabled" class="badges-wrapper">
          <div v-for="category in categories" :key="category.id" class="standard-badge">
            <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="14" />
            <span class="badge-text">{{ Category.getDisplayName(category) }}</span>
          </div>
        </div>
      </div>

      <div class="col-tags">
        <div v-if="profileStore.tagsEnabled" class="badges-wrapper">
          <div v-for="tag in visibleTags" :key="tag.id" class="tag">
            <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
            <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
          </div>

          <div v-if="tags.length > visibleTags.length" class="secondary-text ml-1">+{{ tags.length - visibleTags.length }}</div>
        </div>
      </div>

      <div class="col-budget">
        <div v-if="profileStore.budgetsEnabled && budget" class="standard-badge">
          <app-icon :icon="TablerIconConstants.budget" :size="14" />
          <span class="badge-text">{{ Budget.getDisplayName(budget) }}</span>
        </div>
      </div>

      <div class="col-amount text-right">
        <div class="main-text font-weight-700" :style="amountStyle">{{ transactionAmount }} {{ transactionCurrency }}</div>
        <div v-if="isSplitPayment" class="split-label">{{ $t('split') }}</div>
      </div>

      <div class="col-actions" @click.stop>
        <div class="action-buttons">
          <button class="action-btn edit" type="button" @click="onEdit">
            <app-icon :icon="TablerIconConstants.edit" :size="18" />
          </button>
          <button class="action-btn delete" type="button" @click="onDelete">
            <app-icon :icon="TablerIconConstants.trash" :size="18" />
          </button>
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

<style scoped>
.transaction-list-item-desktop {
  display: grid;
  grid-template-columns: 40px 110px minmax(180px, 1.8fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(120px, 1fr) 120px 80px;
  align-items: center;
  padding: 0.6rem 1.25rem;
  border-bottom: 1px solid var(--van-border-color);
  cursor: pointer;
  transition: background 0.1s ease;
}

.transaction-list-item-desktop:hover {
  background: var(--van-background-3);
}

.transaction-list-item-desktop:last-child {
  border-bottom: none;
}

.main-text {
  font-size: 13px;
  color: var(--van-text-color);
  line-height: 1.4;
}

.secondary-text {
  font-size: 0.75rem;
  color: var(--van-text-color-3);
  line-height: normal;
}

.type-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.description-text {
  word-break: break-word;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notes-snippet {
  max-width: 90%;
}

.badges-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.standard-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.25rem 0.6rem;
  background: rgba(var(--van-gray-7-rgb), 0.05);
  border-radius: 6px;
}

.badge-text {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.split-label {
  color: var(--van-text-color-3);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
  opacity: 0;
  transform: translateX(5px);
  transition: all 0.2s ease;
}

.transaction-list-item-desktop:hover .action-buttons,
.transaction-list-item-desktop:focus-within .action-buttons {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn.edit:hover {
  color: var(--van-primary-color);
  background: rgba(var(--van-primary-color-rgb), 0.1);
}

.action-btn.delete:hover {
  color: #ef5350;
  background: rgba(239, 83, 80, 0.1);
}

.text-right {
  text-align: right;
}
</style>
