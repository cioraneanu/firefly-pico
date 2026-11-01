<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <app-card-info v-if="itemId">
        <template v-if="upcomingDates.length > 0">
          <div class="van-cell-group-title">{{ $t('recurring_transaction_page.upcoming') }}:</div>
          <div class="px-4 flex gap-1 flex-wrap text-12">
            <div v-for="date in upcomingDates" :key="date" class="tag-gray">{{ date }}</div>
          </div>
        </template>
        <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="title" name="Name" :label="$t('name')" rows="1" autosize maxlength="255" :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" required />

        <icon-select v-model="icon" />

        <transaction-type-select v-model="type" name="transactionType" :rules="[rule.required()]" :disabled="!!itemId" required />

        <transaction-amount-field
          v-model:amount="amount"
          v-model:amount-foreign="amountForeign"
          v-model:currency-foreign="currencyForeign"
          :currency="amountCurrency"
          :is-foreign-amount-visible="isForeignAmountVisible"
          :is-foreign-amount-required="isForeignAmountVisible"
          :is-amount-required="true"
          :rules="[rule.positive()]"
        />

        <account-select v-model="accountSource" name="accountSource" :label="$t('transaction.source_account')" :allowed-types="accountSourceAllowedTypes" v-bind="accountSourceBinding" />

        <account-select
          v-model="accountDestination"
          name="accountDestination"
          :label="$t('transaction.destination_account')"
          :allowed-types="accountDestinationAllowedTypes"
          v-bind="accountDestinationBinding"
        />

        <category-select v-model="category" />
        <budget-select v-model="budget" />
        <tag-select v-model="tags" />

        <app-field v-model="description" name="description" :label="$t('description')" rows="1" autosize maxlength="255" :icon="TablerIconConstants.fieldText1" :rules="[rule.required()]" required />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('recurring_transaction_page.repetition') }}:</div>

        <recurring-repetition-type-select v-model="repetitionType" name="repetitionType" :rules="[rule.required()]" :disabled="!!itemId" required />

        <weekday-select v-if="isRepetitionWeekly || isRepetitionNdom" v-model="repetitionWeekday" name="repetitionWeekday" :rules="[rule.required()]" :disabled="!!itemId" required />

        <app-field
          v-if="isRepetitionMonthly"
          v-model="repetitionDay"
          name="repetitionDay"
          :label="$t('recurring_transaction_page.day_of_month')"
          type="number"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="[rule.required(), rule.integerRange(1, 31)]"
          :disabled="!!itemId"
          :min="1"
          :max="31"
          required
        />

        <app-field
          v-if="isRepetitionNdom"
          v-model="repetitionWeek"
          name="repetitionWeek"
          :label="$t('recurring_transaction_page.week_of_month')"
          type="number"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="[rule.required(), rule.integerRange(1, 5)]"
          :disabled="!!itemId"
          :min="1"
          :max="5"
          required
        />

        <app-date
          v-if="isRepetitionYearly"
          v-model="repetitionDate"
          name="repetitionDate"
          :label="$t('recurring_transaction_page.yearly_date')"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="[rule.required()]"
          :disabled="!!itemId"
          :max-date="maxFireflyDate"
          required
        />

        <app-date
          v-model="firstDate"
          name="firstDate"
          :label="$t('recurring_transaction_page.first_date')"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="firstDateRules"
          :min-date="firstDateMin"
          :max-date="maxFireflyDate"
          required
        />

        <recurring-repetition-end-select v-model="repetitionEndType" name="repetitionEndType" :rules="[rule.required()]" required />

        <app-date
          v-if="isEndUntilDate"
          v-model="repeatUntil"
          name="repeatUntil"
          :label="$t('recurring_transaction_page.repeat_until')"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="repeatUntilRules"
          :min-date="firstDate"
          :max-date="maxFireflyDate"
          required
        />

        <app-field
          v-if="isEndNrOfTimes"
          v-model="nrOfRepetitions"
          name="nrOfRepetitions"
          :label="$t('recurring_transaction_page.nr_of_repetitions')"
          type="number"
          :icon="TablerIconConstants.fieldText2"
          :rules="[rule.required(), rule.integerRange(1, 255)]"
          :min="1"
          :max="255"
          required
        />

        <app-boolean v-model="active" :label="$t('active')" />

        <app-field v-model="notes" name="notes" :label="$t('notes')" rows="2" autosize :icon="TablerIconConstants.description" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-2.5" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const {
  itemId,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
  formName,
  title,
  icon,
  type,
  amount,
  amountForeign,
  currencyForeign,
  accountSource,
  accountDestination,
  category,
  budget,
  tags,
  description,
  repetitionType,
  repetitionWeekday,
  repetitionDay,
  repetitionWeek,
  repetitionDate,
  firstDate,
  repetitionEndType,
  repeatUntil,
  nrOfRepetitions,
  active,
  notes,
  upcomingDates,
  transactionsRoute,
  isRepetitionWeekly,
  isRepetitionMonthly,
  isRepetitionNdom,
  isRepetitionYearly,
  isEndUntilDate,
  isEndNrOfTimes,
  maxFireflyDate,
  firstDateMin,
  firstDateRules,
  repeatUntilRules,
  accountSourceAllowedTypes,
  accountDestinationAllowedTypes,
  amountCurrency,
  isForeignAmountVisible,
  isAccountSourceRequired,
  isAccountDestinationRequired,
} = useRecurringTransactionForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const accountBinding = (isRequired) => ({ required: isRequired, clearable: isRequired || !itemId.value, rules: isRequired ? [rule.required()] : [] })
const accountSourceBinding = computed(() => accountBinding(isAccountSourceRequired.value))
const accountDestinationBinding = computed(() => accountBinding(isAccountDestinationRequired.value))

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('recurring_transaction_page.title_edit') : t('recurring_transaction_page.title_add'),
  backRoute: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
})
</script>
