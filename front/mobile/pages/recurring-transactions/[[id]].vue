<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <template v-if="itemId">
          <app-card v-if="upcomingDates.length > 0" :title="$t('recurring_transaction_page.upcoming')" :form="false">
            <div class="mx-chips" style="margin-top: 0">
              <span v-for="date in upcomingDates" :key="date" class="mx-chip fill"
                ><app-icon :icon="IconCalendarEvent" :size="12" :stroke="2" /><span>{{ date }}</span></span
              >
            </div>
          </app-card>

          <app-card-info>
            <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
          </app-card-info>
        </template>

        <app-card>
          <app-field v-model="title" name="name" :label="$t('name')" maxlength="255" :rules="[rule.required()]" required />

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

          <app-field v-model="description" name="description" :label="$t('description')" maxlength="255" :rules="[rule.required()]" required />
        </app-card>

        <app-card :section="$t('recurring_transaction_page.repetition')">
          <div :class="{ 'mx-2': hasRepetitionDetail }">
            <recurring-repetition-type-select v-model="repetitionType" name="repetitionType" :rules="[rule.required()]" :disabled="!!itemId" required />

            <weekday-select v-if="isRepetitionWeekly || isRepetitionNdom" v-model="repetitionWeekday" name="repetitionWeekday" :rules="[rule.required()]" :disabled="!!itemId" required />

            <app-field
              v-if="isRepetitionMonthly"
              v-model="repetitionDay"
              name="repetitionDay"
              type="digit"
              placeholder="1–31"
              :label="$t('recurring_transaction_page.day_of_month')"
              :rules="[rule.required(), rule.integerRange(1, 31)]"
              :disabled="!!itemId"
              required
            />

            <app-date
              v-if="isRepetitionYearly"
              v-model="repetitionDate"
              name="repetitionDate"
              :label="$t('recurring_transaction_page.yearly_date')"
              :rules="[rule.required()]"
              :disabled="!!itemId"
              :max-date="maxFireflyDate"
              required
            />
          </div>

          <app-field
            v-if="isRepetitionNdom"
            v-model="repetitionWeek"
            name="repetitionWeek"
            type="digit"
            placeholder="1–5"
            :label="$t('recurring_transaction_page.week_of_month')"
            :rules="[rule.required(), rule.integerRange(1, 5)]"
            :disabled="!!itemId"
            required
          />

          <div class="mx-2">
            <app-date v-model="firstDate" name="firstDate" :label="$t('recurring_transaction_page.first_date')" :rules="firstDateRules" :min-date="firstDateMin" :max-date="maxFireflyDate" required />
            <recurring-repetition-end-select v-model="repetitionEndType" name="repetitionEndType" :rules="[rule.required()]" required />
          </div>

          <app-date
            v-if="isEndUntilDate"
            v-model="repeatUntil"
            name="repeatUntil"
            :label="$t('recurring_transaction_page.repeat_until')"
            :rules="repeatUntilRules"
            :min-date="firstDate"
            :max-date="maxFireflyDate"
            required
          />

          <app-field
            v-if="isEndNrOfTimes"
            v-model="nrOfRepetitions"
            name="nrOfRepetitions"
            type="digit"
            :label="$t('recurring_transaction_page.nr_of_repetitions')"
            :rules="[rule.required(), rule.integerRange(1, 255)]"
            required
          />

          <div class="mx-hr" />
          <app-boolean v-model="active" :label="$t('active')" />
          <div class="mx-hr" />

          <app-field v-model="notes" name="notes" type="textarea" rows="2" autosize :label="$t('notes')" />
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { IconCalendarEvent } from '@tabler/icons-vue'
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

const hasRepetitionDetail = computed(() => isRepetitionWeekly.value || isRepetitionNdom.value || isRepetitionMonthly.value || isRepetitionYearly.value)

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const accountBinding = (isRequired) => ({ required: isRequired, clearable: isRequired || !itemId.value, rules: isRequired ? [rule.required()] : [] })
const accountSourceBinding = computed(() => accountBinding(isAccountSourceRequired.value))
const accountDestinationBinding = computed(() => accountBinding(isAccountDestinationRequired.value))

const { t } = useI18n()
const route = useRoute()
useToolbar().init({
  title: computed(() => (itemId.value || route.params.id ? t('recurring_transaction_page.title_edit') : t('recurring_transaction_page.title_add'))),
  backRoute: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
})
</script>
