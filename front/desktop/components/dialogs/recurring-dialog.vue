<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'recurring_transaction_page.title_edit' : 'recurring_transaction_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info>
        <icon-calendar-repeat :size="16" />
        <span>{{ $t('recurring_transaction_page.upcoming') }}:</span>
        <d-badge v-for="date in form.upcomingDates" :key="date" variant="outline" class="text-fg">{{ date }}</d-badge>
        <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="ml-auto text-fg">{{ $t('show_transactions') }}</d-button>
      </d-info>
    </template>
    <d-tabs v-model="form.type" :options="typeOptions" block :class="form.itemId && 'pointer-events-none opacity-60'" />
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.title">
      <d-input v-model="form.title" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
    <d-field :label="$t('amount')" :rules="[rule.required(), rule.positive()]" :value="form.amount">
      <d-input v-model="form.amount" type="number" step="0.01" :suffix="Currency.getSymbol(form.amountCurrency)" class="max-w-50" />
    </d-field>
    <d-field v-if="form.isForeignAmountVisible" :label="$t('desktop.foreign_amount')" :rules="[rule.required()]" :value="form.amountForeign">
      <d-input v-model="form.amountForeign" type="number" step="0.01" :suffix="Currency.getSymbol(form.currencyForeign)" class="max-w-50" />
    </d-field>
    <d-field :label="$t('transaction.source_account')" :rules="form.isAccountSourceRequired ? [rule.required()] : []" :value="form.accountSource">
      <d-account-select v-model="form.accountSource" :allowed-types="form.accountSourceAllowedTypes" :clearable="!form.itemId || form.isAccountSourceRequired" />
    </d-field>
    <d-field :label="$t('transaction.destination_account')" :rules="form.isAccountDestinationRequired ? [rule.required()] : []" :value="form.accountDestination">
      <d-account-select v-model="form.accountDestination" :allowed-types="form.accountDestinationAllowedTypes" :clearable="!form.itemId || form.isAccountDestinationRequired" />
    </d-field>
    <d-field :label="$t('category')">
      <d-category-select v-model="form.category" />
    </d-field>
    <d-field :label="$t('budget')">
      <d-budget-select v-model="form.budget" />
    </d-field>
    <d-field :label="$t('tags')">
      <d-tag-select v-model="form.tags" multiple />
    </d-field>
    <d-field :label="$t('description')" :rules="[rule.required()]" :value="form.description">
      <d-input v-model="form.description" />
    </d-field>

    <h3 class="mt-2 border-t border-line pt-5 text-sm font-semibold">{{ $t('recurring_transaction_page.repetition') }}</h3>
    <d-field :label="$t('recurring_transaction_page.repetition_type')" :rules="[rule.required()]" :value="form.repetitionType">
      <d-enum-select v-model="form.repetitionType" :options="RecurringTransaction.repetitionTypesList()" :class="form.itemId && 'pointer-events-none opacity-60'" />
    </d-field>
    <d-field v-if="form.isRepetitionWeekly || form.isRepetitionNdom" :label="$t('recurring_transaction_page.weekday')" :rules="[rule.required()]" :value="form.repetitionWeekday">
      <d-enum-select v-model="form.repetitionWeekday" :options="RecurringTransaction.weekdaysList()" :class="form.itemId && 'pointer-events-none opacity-60'" />
    </d-field>
    <d-field v-if="form.isRepetitionMonthly" :label="$t('recurring_transaction_page.day_of_month')" :rules="[rule.required(), rule.integerRange(1, 31)]" :value="form.repetitionDay">
      <d-input v-model="form.repetitionDay" type="number" min="1" :disabled="!!form.itemId" class="max-w-30" />
    </d-field>
    <d-field v-if="form.isRepetitionNdom" :label="$t('recurring_transaction_page.week_of_month')" :rules="[rule.required(), rule.integerRange(1, 5)]" :value="form.repetitionWeek">
      <d-input v-model="form.repetitionWeek" type="number" min="1" :disabled="!!form.itemId" class="max-w-30" />
    </d-field>
    <d-field v-if="form.isRepetitionYearly" :label="$t('recurring_transaction_page.yearly_date')" :rules="[rule.required()]" :value="form.repetitionDate">
      <d-date v-model="form.repetitionDate" :class="form.itemId && 'pointer-events-none opacity-60'" />
    </d-field>
    <d-field :label="$t('recurring_transaction_page.first_date')" :rules="form.firstDateRules" :value="form.firstDate">
      <d-date v-model="form.firstDate" />
    </d-field>
    <d-field :label="$t('recurring_transaction_page.repetition_ends')" :rules="[rule.required()]" :value="form.repetitionEndType">
      <d-enum-select v-model="form.repetitionEndType" :options="RecurringTransaction.repetitionEndTypesList()" />
    </d-field>
    <d-field v-if="form.isEndUntilDate" :label="$t('recurring_transaction_page.repeat_until')" :rules="form.repeatUntilRules" :value="form.repeatUntil">
      <d-date v-model="form.repeatUntil" />
    </d-field>
    <d-field v-if="form.isEndNrOfTimes" :label="$t('recurring_transaction_page.nr_of_repetitions')" :rules="[rule.required(), rule.integerRange(1, 255)]" :value="form.nrOfRepetitions">
      <d-input v-model="form.nrOfRepetitions" type="number" min="1" class="max-w-30" />
    </d-field>
    <d-field :label="$t('active')">
      <d-switch v-model="form.active" />
    </d-field>
    <d-field :label="$t('notes')" top>
      <d-textarea v-model="form.notes" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import { IconCalendarRepeat, IconCoins } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'
import RecurringTransaction from '~/core/models/RecurringTransaction'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST)
const form = reactive(useRecurringTransactionForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
const typeOptions = useTransactionTypeOptions()
</script>
