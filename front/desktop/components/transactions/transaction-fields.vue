<template>
  <d-type-pills v-model="type" />
  <d-form :id="formName" class="mt-2" @submit="emit('submit')">
    <d-field v-if="isFieldVisible(transactionFormField.amount)" :label="$t('amount')" :rules="[rule.required()]" :value="amount" :style="getStyleForField(transactionFormField.amount)">
      <d-amount-input v-model:amount="amount" v-model:amount-foreign="amountForeign" v-model:currency-foreign="currencyForeign" :currency="sourceCurrency" :foreign="isForeignAmountVisible" />
    </d-field>
    <d-field
      v-if="isFieldVisible(transactionFormField.sourceAccount)"
      top
      :label="$t('transaction.source_account')"
      :rules="accountSourceBinding.rules"
      :value="accountSource"
      :style="getStyleForField(transactionFormField.sourceAccount)"
    >
      <d-account-select v-model="accountSource" :allowed-types="accountSourceAllowedTypes" clearable />
      <nuxt-link v-if="showSourceAccountSuggestion" :to="RouteConstants.ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES" class="w-fit text-[13px] text-dim underline underline-offset-3 hover:text-fg">
        {{ $t('desktop.set_default') }}
      </nuxt-link>
    </d-field>
    <d-field
      v-if="isFieldVisible(transactionFormField.destinationAccount)"
      :label="$t('transaction.destination_account')"
      :rules="accountDestinationBinding.rules"
      :value="accountDestination"
      :style="getStyleForField(transactionFormField.destinationAccount)"
    >
      <d-account-select v-model="accountDestination" :allowed-types="accountDestinationAllowedTypes" clearable />
    </d-field>
    <d-field
      v-if="isFieldVisible(transactionFormField.description)"
      :label="$t('description')"
      :rules="[rule.required()]"
      :value="description"
      :style="getStyleForField(transactionFormField.description)"
    >
      <d-input v-model="description" :placeholder="$t('description')" />
    </d-field>
    <d-field v-if="profileStore.categoriesEnabled && isFieldVisible(transactionFormField.category)" :label="$t('category')" :style="getStyleForField(transactionFormField.category)">
      <d-category-select v-model="category" />
    </d-field>
    <d-field v-if="isFieldVisible(transactionFormField.date)" :label="$t('date')" :rules="[rule.required()]" :value="date" top :style="getStyleForField(transactionFormField.date)">
      <div class="flex flex-wrap items-center gap-2">
        <d-date v-model="date" time />
        <div class="flex">
          <d-button size="sm" :icon="IconChevronLeft" class="rounded-r-none" @click="onSubDay">{{ $t('desktop.one_day') }}</d-button>
          <d-button size="sm" class="rounded-none border-x-0" @click="onToday">{{ $t('today') }}</d-button>
          <d-button size="sm" class="rounded-l-none" @click="onAddDay">
            {{ $t('desktop.one_day') }}
            <icon-chevron-right :size="14" />
          </d-button>
        </div>
      </div>
    </d-field>
    <template v-for="field in transactionExtraDateFieldList" :key="field.code">
      <d-field v-if="isFieldVisible(field)" :label="$t(field.t)" :style="getStyleForField(field)">
        <d-date v-model="extraDates[field.code].value" clearable />
      </d-field>
    </template>
    <d-field v-if="profileStore.tagsEnabled && isFieldVisible(transactionFormField.tags)" :label="$t('tags')" :style="getStyleForField(transactionFormField.tags)">
      <d-tag-select v-model="tags" multiple />
    </d-field>
    <d-field v-if="profileStore.budgetsEnabled && isFieldVisible(transactionFormField.budget)" :label="$t('budget')" :style="getStyleForField(transactionFormField.budget)">
      <d-budget-select v-model="budget" />
    </d-field>
    <d-field
      v-if="profileStore.piggyBanksEnabled && isTypeTransfer && !itemId && isFieldVisible(transactionFormField.piggyBank)"
      :label="$t('piggy_bank')"
      :style="getStyleForField(transactionFormField.piggyBank)"
    >
      <d-piggy-bank-select v-model="piggyBank" />
    </d-field>
    <d-field v-if="isFieldVisible(transactionFormField.notes)" :label="$t('notes')" top :style="getStyleForField(transactionFormField.notes)">
      <d-textarea v-model="notes" :placeholder="$t('notes')" />
    </d-field>
    <d-field v-if="itemId && isFieldVisible(transactionFormField.attachments)" :label="$t('attachments')" top :style="getStyleForField(transactionFormField.attachments)">
      <d-attachments :transaction="item" />
    </d-field>
  </d-form>
</template>

<script setup>
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import { transactionExtraDateFieldList, transactionFormField } from '~/core/constants/TransactionConstants'
import Transaction from '~/core/models/Transaction'
import { rule } from '~/core/utils/ValidationUtils'

const item = defineModel({ type: Object, default: () => new Transaction().getEmpty() })
defineProps({ formName: String })
const emit = defineEmits(['submit'])

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
  isFieldVisible,
  accountSourceBinding,
  accountDestinationBinding,
  showSourceAccountSuggestion,
} = useTransactionForm({ item, itemId, profileStore })

defineExpose({ applyAssistantTransaction })
</script>
