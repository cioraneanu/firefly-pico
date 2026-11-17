<template>
  <section class="mx-card">
    <div class="mx-form">
      <div class="mx-row__m">
        <h2 class="mx-card__t wrap-anywhere">{{ groupTitle }}</h2>
        <p v-if="dateFormatted" class="mx-card__d">{{ dateFormatted }}</p>
      </div>
      <div class="mx-sum">
        <span class="mx-chip split">
          <app-icon :icon="IconArrowsSplit2" :size="12" :stroke="2" />
          <span>{{ $t('transaction.split_count', { count: splits.length }) }}</span>
        </span>
        <div class="mx-total">
          <span>{{ $t('transaction.total_amount') }}</span>
          <b v-for="total in totals" :key="total.currencyId ?? total.currencyCode ?? total.currencySymbol" class="mx-amt mx-money" :class="amountClass">
            {{ formatAmountWithCurrency(total.amount, total.currencySymbol, total.currencyCode) }}
          </b>
        </div>
      </div>
    </div>
  </section>

  <h2 class="mx-sec">
    <span>{{ $t('transaction.split_transaction') }}</span>
  </h2>

  <section v-for="(split, index) in splits" :key="split.transaction_journal_id ?? index" class="mx-card">
    <div class="mx-card__h">
      <div class="min-w-0">
        <p class="mx-card__d">{{ index + 1 }} / {{ splits.length }}</p>
        <h2 class="mx-card__t wrap-anywhere">{{ split.description }}</h2>
      </div>
      <div class="flex flex-col items-end">
        <span class="mx-amt mx-money" :class="amountClass">{{ formatAmountWithCurrency(split.amount, split.currency_symbol, split.currency_code) }}</span>
        <span v-if="split.amountForeign ?? split.foreign_amount" class="mx-date">
          {{ formatAmountWithCurrency(split.amountForeign ?? split.foreign_amount, split.foreign_currency_symbol, split.foreign_currency_code) }}
        </span>
      </div>
    </div>

    <div class="mx-card__c">
      <div class="mx-kv">
        <div v-if="sourceName(split) || destinationName(split)">
          <span class="k"><app-icon :icon="TablerIconConstants.account" :size="14" :stroke="2" />{{ $t('accounts') }}</span>
          <b>{{ [sourceName(split), destinationName(split)].filter(Boolean).join(' → ') }}</b>
        </div>

        <div v-if="profileStore.categoriesEnabled && (split.category || split.category_name)">
          <span class="k"><app-icon :icon="TablerIconConstants.category" :size="14" :stroke="2" />{{ $t('category') }}</span>
          <b>{{ split.category ? Category.getDisplayName(split.category) : split.category_name }}</b>
        </div>

        <div v-if="profileStore.budgetsEnabled && (split.budget || split.budget_name)">
          <span class="k"><app-icon :icon="TablerIconConstants.budget" :size="14" :stroke="2" />{{ $t('budget') }}</span>
          <b>{{ split.budget ? Budget.getDisplayName(split.budget) : split.budget_name }}</b>
        </div>

        <div v-if="profileStore.tagsEnabled && split.tags?.filter(Boolean).length">
          <span class="k"><app-icon :icon="TablerIconConstants.tag" :size="14" :stroke="2" />{{ $t('tags') }}</span>
          <span class="mx-chips justify-end" style="margin-top: 0">
            <span v-for="tag in split.tags.filter(Boolean)" :key="tag.id" class="mx-chip">{{ Tag.getDisplayNameEllipsized(tag, 30) }}</span>
          </span>
        </div>

        <div v-if="split.subscription_name ?? split.bill_name">
          <span class="k"><app-icon :icon="TablerIconConstants.recurringTransaction" :size="14" :stroke="2" />{{ $t('transaction.subscription') }}</span>
          <b>{{ split.subscription_name ?? split.bill_name }}</b>
        </div>

        <div v-for="field in getPopulatedExtraDateFields(split)" :key="field.code">
          <span class="k"><app-icon :icon="field.icon" :size="14" :stroke="2" />{{ $t(field.t) }}</span>
          <b>{{ DateUtils.dateToUI(split[field.code]) }}</b>
        </div>
      </div>

      <div v-if="split.notes" class="mx-note mt-2">
        <app-icon :icon="TablerIconConstants.fieldText1" :size="16" :stroke="2" />
        <span class="wrap-anywhere">{{ split.notes }}</span>
      </div>
    </div>
  </section>

  <section v-show="transaction.id && hasAttachments" class="mx-card">
    <div class="mx-form">
      <transaction-attachments-list :transaction="transaction" read-only @count="hasAttachments = $event > 0" />
    </div>
  </section>
</template>

<script setup>
import { IconArrowsSplit2 } from '@tabler/icons-vue'
import Account from '~/core/models/Account.js'
import Budget from '~/core/models/Budget.js'
import Category from '~/core/models/Category.js'
import Tag from '~/core/models/Tag.js'
import DateUtils from '~/core/utils/DateUtils.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Transaction from '~/core/models/Transaction.js'
import TransactionAttachmentsList from '~/mobile/components/transaction/transaction-attachements/transaction-attachments-list.vue'
import { formatAmount } from '~/core/utils/AmountUtils.js'
import { transactionExtraDateFieldList } from '~/core/constants/TransactionConstants.js'

// Read-only details of a split transaction (design: MX-TransactionSplit, without split editing).
const props = defineProps({
  transaction: {
    type: Object,
    default: () => ({}),
  },
})

const hasAttachments = ref(false)

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
    e: typeCode === Transaction.types.expense.code,
    i: typeCode === Transaction.types.income.code,
    t: typeCode === Transaction.types.transfer.code,
  }
})

const sourceName = (split) => (split.accountSource ? Account.getDisplayName(split.accountSource) : split.source_name)
const destinationName = (split) => (split.accountDestination ? Account.getDisplayName(split.accountDestination) : split.destination_name)

const formatAmountWithCurrency = (amount, currencySymbol, currencyCode) => [formatAmount(amount, locale.value), currencySymbol ?? currencyCode].filter(Boolean).join(' ')

const getPopulatedExtraDateFields = (split) => transactionExtraDateFieldList.filter((field) => split[field.code])
</script>
