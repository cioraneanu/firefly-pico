<template>
  <div class="transaction-table-wrapper">
    <div class="transaction-table">
      <!-- Header -->
      <div class="table-header">
        <div class="col-type"></div>
        <div class="col-date">{{ $t('date') }}</div>
        <div class="col-description">{{ $t('description') }}</div>
        <div class="col-accounts">{{ $t('accounts') }}</div>
        <div class="col-category">{{ $t('category') }}</div>
        <div class="col-tags">{{ $t('tags') }}</div>
        <div class="col-budget">{{ $t('budget') }}</div>
        <div class="col-amount text-right">{{ $t('amount') }}</div>
        <div class="col-actions"></div>
      </div>

      <!-- Rows -->
      <div v-for="item in list" :key="item.id" class="table-row" @click="onEdit(item)">
        <!-- Type Column -->
        <div class="col-type">
          <div class="type-indicator" :class="getTypeClass(item)"></div>
        </div>

        <!-- Date Column -->
        <div class="col-date">
          <div class="main-text font-weight-600">{{ getDateFormatted(item) }}</div>
          <div class="secondary-text">{{ getTimeAgo(item) }}</div>
        </div>

        <!-- Description Column -->
        <div class="col-description">
          <div class="flex-center-vertical gap-1">
            <span class="main-text description-text clamp-2">{{ getDescription(item) }}</span>
            <app-icon v-if="hasAttachments(item)" :icon="TablerIconConstants.attachment" :size="14" color="#1E88E5" />
          </div>
          <div v-if="getNotesRaw(item)" class="secondary-text notes-snippet single-line" :title="getNotesRaw(item)">
            {{ getNotesRaw(item) }}
          </div>
        </div>

        <!-- Accounts Column -->
        <div class="col-accounts">
          <div class="badges-wrapper mt-1">
            <div v-for="account in getDisplayedAccounts(item)" :key="account.id" class="standard-badge account-badge">
              <app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="14" />
              <span class="badge-text">{{ Account.getDisplayName(account) }}</span>
            </div>
          </div>
        </div>

        <!-- Category Column -->
        <div class="col-category">
          <div class="badges-wrapper mt-1">
            <div v-for="category in getCategories(item)" :key="category.id" class="standard-badge category-badge">
              <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="14" />
              <span class="badge-text">{{ Category.getDisplayName(category) }}</span>
            </div>
          </div>
        </div>

        <!-- Tags Column -->
        <div class="col-tags">
          <div class="badges-wrapper mt-1">
            <div v-for="tag in getTags(item).slice(0, 3)" class="tag">
              <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
              <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
            </div>

            <div v-if="getTags(item).length > 3" class="secondary-text ml-1">+{{ getTags(item).length - 3 }}</div>
          </div>
        </div>

        <!-- Budget Column -->
        <div class="col-budget">
          <div v-if="getBudget(item)" class="standard-badge budget-badge">
            <app-icon :icon="TablerIconConstants.budget" :size="14" />
            <span class="badge-text">{{ Budget.getDisplayName(getBudget(item)) }}</span>
          </div>
        </div>

        <!-- Amount Column -->
        <div class="col-amount text-right">
          <div class="main-text font-weight-700 amount-value" :style="getAmountStyle(item)">{{ getAmountFormatted(item) }} {{ getCurrency(item) }}</div>
          <div v-if="isSplit(item)" class="split-label">{{ $t('split') }}</div>
        </div>

        <!-- Actions Column -->
        <div class="col-actions" @click.stop>
          <div class="action-buttons">
            <div class="action-btn edit" @click="onEdit(item)">
              <app-icon :icon="TablerIconConstants.edit" :size="18" />
            </div>
            <div class="action-btn delete" @click="onDelete(item)">
              <app-icon :icon="TablerIconConstants.trash" :size="18" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { get, head, isEqual, capitalize } from 'lodash'
import Transaction from '~/models/Transaction'
import Account from '~/models/Account'
import Category from '~/models/Category'
import Tag from '~/models/Tag'
import Budget from '~/models/Budget'
import DateUtils from '~/utils/DateUtils'
import TablerIconConstants from '~/constants/TablerIconConstants'
import { formatTimeAgo } from '@vueuse/core'

const props = defineProps({
  list: { type: Array, required: true },
})

const emit = defineEmits(['onEdit', 'onDelete'])

const accountStore = useAccountStore()

const getFirstTransaction = (item) => head(get(item, 'attributes.transactions', []))
const getTransactions = (item) => get(item, 'attributes.transactions', [])

const getDescription = (item) => get(item, 'attributes.group_title') ?? get(getFirstTransaction(item), 'description') ?? ' - '
const hasAttachments = (item) => getTransactions(item).some((t) => t.has_attachments)

const getDisplayedAccounts = (item) => {
  const first = getFirstTransaction(item)
  return [get(accountStore.accountDictionary, get(first, 'source_id')), get(accountStore.accountDictionary, get(first, 'destination_id'))].filter(Boolean)
}

const getCategories = (item) => {
  return getTransactions(item)
    .map((t) => t.category)
    .flat()
    .filter(Boolean)
    .uniqBy('id')
}

const getBudget = (item) => get(getFirstTransaction(item), 'budget')

const getTags = (item) => {
  return getTransactions(item)
    .map((t) => t.tags)
    .flat()
    .filter(Boolean)
    .uniqBy('id')
}

const getNotesRaw = (item) => get(getFirstTransaction(item), 'notes')

const getDateFormatted = (item) => DateUtils.dateToUI(DateUtils.autoToDate(get(getFirstTransaction(item), 'date')))
const getTimeAgo = (item) => capitalize(formatTimeAgo(DateUtils.autoToDate(get(getFirstTransaction(item), 'date'))))

const getAmountFormatted = (item) => {
  const type = get(getFirstTransaction(item), 'type')
  const sign = isEqual(type, Transaction.types.expense) ? '-' : isEqual(type, Transaction.types.income) ? '+' : ''
  return `${sign}${Transaction.getAmountFormatted(item)}`
}

const getCurrency = (item) => get(getFirstTransaction(item), 'currency_symbol', ' - ')
const isSplit = (item) => getTransactions(item).length > 1

const getTypeClass = (item) => {
  const type = get(getFirstTransaction(item), 'type')
  if (isEqual(type, Transaction.types.expense)) return 'color-expense'
  if (isEqual(type, Transaction.types.income)) return 'color-income'
  if (isEqual(type, Transaction.types.transfer)) return 'color-transfer'
  return ''
}

const getAmountStyle = (item) => {
  const type = get(getFirstTransaction(item), 'type')
  if (isEqual(type, Transaction.types.expense)) return 'color: var(--expense2)'
  if (isEqual(type, Transaction.types.income)) return 'color: var(--income1)'
  if (isEqual(type, Transaction.types.transfer)) return 'color: var(--transfer1)'
  return ''
}

const onEdit = (item) => emit('onEdit', item)
const onDelete = (item) => emit('onDelete', item)
</script>

<style scoped>
.transaction-table-wrapper {
  padding: 1.5rem;
  width: 100%;
  overflow-x: auto;
}

.transaction-table {
  min-width: 1100px;
  background: var(--van-background-2);
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

/* Header Styling */
.table-header {
  display: grid;
  grid-template-columns: 40px 110px 1.8fr 1fr 1fr 0.8fr 1fr 120px 80px;
  padding: 1rem 1.25rem;
  background: var(--van-background-3);
  border-bottom: 1px solid var(--van-border-color);
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--van-text-color-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Row Styling */
.table-row {
  display: grid;
  grid-template-columns: 40px 110px 1.8fr 1fr 1fr 0.8fr 1fr 120px 80px;
  padding: 0.6rem 1.25rem;
  border-bottom: 1px solid var(--van-border-color);
  align-items: center;
  transition: background 0.1s ease;
  cursor: pointer;
}

.table-row:hover {
  background: var(--van-background-3);
}

.table-row:last-child {
  border-bottom: none;
}

/* Shared Text Styles */
.main-text {
  font-size: 0.875rem; /* 14px */
  color: var(--van-text-color);
  line-height: 1.4;
}

.secondary-text {
  font-size: 0.75rem; /* 12px */
  color: var(--van-text-color-3);
  line-height: normal;
}

/* Type Indicator */
.type-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Description handling */
.description-text {
  word-break: break-all;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

/* Standardized Badges */
.badges-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.standard-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  background: rgba(var(--van-gray-7-rgb), 0.05);
  border-radius: 6px;
  max-width: 100%;
}

.badge-text {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Amount & Meta */
.amount-value {
  font-size: 0.9375rem; /* ~15px */
}

.split-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--van-text-color-3);
  letter-spacing: 0.05em;
}

/* Actions */
.action-buttons {
  display: flex;
  gap: 0.4rem;
  opacity: 0;
  transform: translateX(5px);
  transition: all 0.2s ease;
}

.table-row:hover .action-buttons {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  padding: 5px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background 0.15s;
}

.action-btn.edit:hover {
  background: rgba(var(--van-primary-color-rgb), 0.1);
  color: var(--van-primary-color);
}
.action-btn.delete:hover {
  background: rgba(239, 83, 80, 0.1);
  color: #ef5350;
}

.text-right {
  text-align: right;
}
</style>
