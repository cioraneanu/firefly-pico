<template>
  <transaction-split-view v-if="isSplitTransaction" :transaction="item" />

  <template v-else>
    <!-- No <form> here: the fields register with the surrounding <app-form> (the page, or the ramble edit sheet) -->
    <section class="mx-card">
      <div class="mx-form">
        <transaction-type-tabs v-model="type" style="order: -1" />

        <transaction-amount-field
          v-model:amount="amount"
          v-model:amount-foreign="amountForeign"
          v-model:currency-foreign="currencyForeign"
          :currency="sourceCurrency"
          :is-foreign-amount-visible="isForeignAmountVisible"
          name="amount"
          :style="getStyleForField(transactionFormField.amount)"
          :is-amount-required="true"
        />

        <account-select
          v-model="accountSource"
          name="accountSource"
          :label="$t('transaction.source_account')"
          :allowed-types="accountSourceAllowedTypes"
          :style="getStyleForField(transactionFormField.sourceAccount)"
          v-bind="accountSourceBinding"
        >
          <template #label>
            <div class="mx-l">
              {{ $t('transaction.source_account') }}<span v-if="accountSourceBinding.required" class="req">*</span>
              <button v-if="showSourceAccountSuggestion" type="button" class="hint underline underline-offset-3" @click="navigateTo(RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES)">
                {{ $t('desktop.set_default') }}
              </button>
            </div>
          </template>
        </account-select>

        <account-select
          v-model="accountDestination"
          name="accountDestination"
          :label="$t('transaction.destination_account')"
          :allowed-types="accountDestinationAllowedTypes"
          :style="getStyleForField(transactionFormField.destinationAccount)"
          v-bind="accountDestinationBinding"
        />

        <category-select v-if="profileStore.categoriesEnabled" v-model="category" :style="getStyleForField(transactionFormField.category)" />

        <app-field
          v-model="description"
          :label="$t('description')"
          name="description"
          type="textarea"
          rows="1"
          autosize
          :placeholder="$t('description')"
          :rules="[rule.required()]"
          required
          :style="getStyleForField(transactionFormField.description)"
        />

        <tag-select v-if="profileStore.tagsEnabled" v-model="tags" :style="getStyleForField(transactionFormField.tags)" />

        <div class="mx-f" :style="getStyleForField(transactionFormField.date)">
          <app-date-time-grid v-model="date" name="date" :label="$t('date')" :rules="[rule.required()]" required />

          <div class="mx-quick" role="group">
            <button type="button" class="mx-quick__b" @click="onSubDay">
              <app-icon :icon="IconChevronLeft" :size="13" :stroke="2" />
              <span>{{ $t('desktop.one_day') }}</span>
            </button>
            <button type="button" class="mx-quick__b" :class="{ on: isDateToday }" :aria-pressed="isDateToday" @click="onToday">{{ $t('today') }}</button>
            <button type="button" class="mx-quick__b" @click="onAddDay">
              <span>{{ $t('desktop.one_day') }}</span>
              <app-icon :icon="IconChevronRight" :size="13" :stroke="2" />
            </button>
          </div>
        </div>

        <app-date
          v-for="extraDateField in transactionExtraDateFieldList"
          :key="extraDateField.code"
          v-model="extraDates[extraDateField.code].value"
          :label="$t(extraDateField.t)"
          :icon="extraDateField.icon"
          :style="getStyleForField(extraDateField)"
        />

        <transaction-note-field v-model="notes" :style="getStyleForField(transactionFormField.notes)" />

        <budget-select v-if="profileStore.budgetsEnabled" v-model="budget" :style="getStyleForField(transactionFormField.budget)" />

        <piggy-bank-select v-if="profileStore.piggyBanksEnabled && isTypeTransfer && !itemId" v-model="piggyBank" :style="getStyleForField(transactionFormField.piggyBank)" />

        <transaction-attachments-list :transaction="item" :style="getStyleForField(transactionFormField.attachments)" />
      </div>
    </section>

    <slot name="actions" :is-split-transaction="isSplitTransaction" :is-type-transfer="isTypeTransfer" />
  </template>
</template>

<script setup>
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import { isToday } from 'date-fns'
import RouteConstants from '~/core/constants/RouteConstants'
import Transaction from '~/core/models/Transaction'
import TransactionAttachmentsList from '~/mobile/components/transaction/transaction-attachements/transaction-attachments-list.vue'
import TransactionNoteField from '~/mobile/components/transaction/transaction-note-field.vue'
import TransactionSplitView from '~/mobile/components/transaction/transaction-split-view.vue'
import { transactionFormField, transactionExtraDateFieldList } from '~/core/constants/TransactionConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'
import { useTransactionForm } from '~/core/composables/useTransactionForm.js'

// Fields of one (non-split) transaction, ordered / hidden by profileStore.transactionFormFieldsConfig through getStyleForField.
// Split transactions render the read-only split view instead.
const item = defineModel({
  type: Object,
  default: () => new Transaction().getEmpty(),
})

const profileStore = useProfileStore()
const itemId = computed(() => item.value?.id)

const {
  amount,
  amountForeign,
  date,
  extraDates,
  tags,
  description,
  notes,
  budget,
  piggyBank,
  accountSource,
  accountDestination,
  category,
  type,
  currencyForeign,
  isSplitTransaction,
  accountSourceAllowedTypes,
  accountDestinationAllowedTypes,
  sourceCurrency,
  isForeignAmountVisible,
  applyAssistantTransaction,
  onSubDay,
  onToday,
  onAddDay,
  isTypeTransfer,
  getStyleForField,
  accountSourceBinding,
  accountDestinationBinding,
  showSourceAccountSuggestion,
} = useTransactionForm({ item, itemId, profileStore })

const isDateToday = computed(() => !!date.value && isToday(date.value))

defineExpose({
  applyAssistantTransaction,
  isSplitTransaction,
})
</script>
