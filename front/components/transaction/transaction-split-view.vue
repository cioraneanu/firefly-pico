<template>
  <div class="transaction-split-view" :class="{ 'transaction-split-view-desktop': appStore.isDesktopLayout }">
    <van-cell-group inset class="transaction-split-summary">
      <van-cell class="transaction-split-summary-cell">
        <template #title>
          <div class="transaction-split-summary-heading">
            <div class="font-600">{{ groupTitle }}</div>
            <transaction-split-badge />
          </div>
          <div class="transaction-split-summary-meta">
            <span>{{ $t('transaction.split_count', { count: splits.length }) }}</span>
            <span v-if="dateFormatted">•</span>
            <span v-if="dateFormatted">{{ dateFormatted }}</span>
          </div>
        </template>

        <template #value>
          <div class="transaction-split-total">
            <div class="transaction-split-total-label">{{ $t('transaction.total_amount') }}</div>
            <div v-for="total in totals" :key="total.currencyId ?? total.currencyCode ?? total.currencySymbol" class="transaction-split-total-value" :class="amountClass">
              {{ formatAmountWithCurrency(total.amount, total.currencySymbol, total.currencyCode) }}
            </div>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <div class="transaction-split-list" role="list">
      <van-cell-group v-for="(split, index) in splits" :key="split.transaction_journal_id ?? index" inset class="transaction-split-card" role="listitem">
        <van-cell class="transaction-split-card-header">
          <template #title>
            <div class="transaction-split-card-position">{{ index + 1 }} / {{ splits.length }}</div>
            <div class="transaction-split-card-title word-break-word" role="heading" aria-level="2">{{ split.description }}</div>
          </template>

          <template #value>
            <div class="transaction-split-card-amount" :class="amountClass">
              {{ formatAmountWithCurrency(split.amount, split.currency_symbol, split.currency_code) }}
            </div>
            <div v-if="split.amountForeign ?? split.foreign_amount" class="transaction-split-foreign-amount">
              {{ formatAmountWithCurrency(split.amountForeign ?? split.foreign_amount, split.foreign_currency_symbol, split.foreign_currency_code) }}
            </div>
          </template>
        </van-cell>

        <van-cell v-if="split.accountSource || split.accountDestination || split.source_name || split.destination_name">
          <template #title>
            <div class="account-badges-row">
              <account-badge v-if="split.accountSource" :value="split.accountSource" />
              <div v-else-if="split.source_name" class="transaction-split-fallback-badge">
                <app-icon :icon="TablerIconConstants.account" :size="16" />
                <span>{{ split.source_name }}</span>
              </div>

              <app-icon v-if="(split.accountSource || split.source_name) && (split.accountDestination || split.destination_name)" icon="IconArrowNarrowRight" :size="16" class="account-flow-arrow" />

              <account-badge v-if="split.accountDestination" :value="split.accountDestination" />
              <div v-else-if="split.destination_name" class="transaction-split-fallback-badge">
                <app-icon :icon="TablerIconConstants.account" :size="16" />
                <span>{{ split.destination_name }}</span>
              </div>
            </div>
          </template>
        </van-cell>

        <van-cell v-if="profileStore.categoriesEnabled && (split.category || split.category_name)" class="transaction-split-detail-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="TablerIconConstants.category" :size="17" />
              <span>{{ $t('category') }}</span>
            </div>
          </template>
          <template #value>
            <category-badge v-if="split.category" :value="split.category" />
            <span v-else>{{ split.category_name }}</span>
          </template>
        </van-cell>

        <van-cell v-if="profileStore.budgetsEnabled && (split.budget || split.budget_name)" class="transaction-split-detail-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="TablerIconConstants.budget" :size="17" />
              <span>{{ $t('budget') }}</span>
            </div>
          </template>
          <template #value>
            <div class="transaction-split-detail-text">{{ split.budget ? Budget.getDisplayName(split.budget) : split.budget_name }}</div>
          </template>
        </van-cell>

        <van-cell v-if="profileStore.tagsEnabled && split.tags?.filter(Boolean).length" class="transaction-split-detail-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="TablerIconConstants.tag" :size="17" />
              <span>{{ $t('tags') }}</span>
            </div>
          </template>
          <template #value>
            <div class="transaction-split-tags">
              <tag-badge v-for="tag in split.tags.filter(Boolean)" :key="tag.id" :value="tag" :max-length="30" />
            </div>
          </template>
        </van-cell>

        <van-cell v-if="split.subscription_name ?? split.bill_name" class="transaction-split-detail-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="TablerIconConstants.recurringTransaction" :size="17" />
              <span>{{ $t('transaction.subscription') }}</span>
            </div>
          </template>
          <template #value>
            <div class="transaction-split-detail-text">{{ split.subscription_name ?? split.bill_name }}</div>
          </template>
        </van-cell>

        <van-cell v-for="field in getPopulatedExtraDateFields(split)" :key="field.code" class="transaction-split-detail-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="field.icon" :size="17" />
              <span>{{ $t(field.t) }}</span>
            </div>
          </template>
          <template #value>
            <div class="transaction-split-detail-text">{{ DateUtils.dateToUI(split[field.code]) }}</div>
          </template>
        </van-cell>

        <van-cell v-if="split.notes" class="transaction-split-notes-row">
          <template #title>
            <div class="transaction-split-detail-label">
              <app-icon :icon="TablerIconConstants.fieldText1" :size="17" />
              <span>{{ $t('notes') }}</span>
            </div>
            <div class="transaction-split-notes word-break-word">{{ split.notes }}</div>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <van-cell-group v-show="transaction.id && hasAttachments" inset class="transaction-split-attachments">
      <transaction-attachments-list :transaction="transaction" read-only @count="hasAttachments = $event > 0" />
    </van-cell-group>
  </div>
</template>

<script setup>
import Budget from '~/models/Budget.js'
import DateUtils from '~/utils/DateUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Transaction from '~/models/Transaction.js'
import TransactionAttachmentsList from '~/components/transaction/transaction-attachements/transaction-attachments-list.vue'
import TransactionSplitBadge from '~/components/transaction/transaction-split-badge.vue'
import { formatAmount } from '~/utils/AmountUtils.js'
import { transactionExtraDateFieldList } from '~/constants/TransactionConstants.js'

const props = defineProps({
  transaction: {
    type: Object,
    default: () => ({}),
  },
})

const hasAttachments = ref(false)

const appStore = useAppStore()
const profileStore = useProfileStore()
const { locale } = useI18n()

const splits = computed(() => Transaction.getSplits(props.transaction))
const totals = computed(() => Transaction.getSplitTotals(props.transaction))
const groupTitle = computed(() => Transaction.getDescription(props.transaction))
const dateFormatted = computed(() => {
  const date = Transaction.getDate(props.transaction)
  return date ? DateUtils.dateToUIWithTime(date) : null
})

const amountClass = computed(() => {
  const typeCode = Transaction.getTypeCode(props.transaction)
  return {
    'color-expense': typeCode === Transaction.types.expense.code,
    'color-income': typeCode === Transaction.types.income.code,
    'color-transfer': typeCode === Transaction.types.transfer.code,
  }
})

const formatAmountWithCurrency = (amount, currencySymbol, currencyCode) => [formatAmount(amount, locale.value), currencySymbol ?? currencyCode].filter(Boolean).join(' ')

const getPopulatedExtraDateFields = (split) => transactionExtraDateFieldList.filter((field) => split[field.code])
</script>
