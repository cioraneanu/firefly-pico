<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" :name="formName" @submit="saveItem" @failed="onValidationError" class="">
      <app-card-info v-if="itemId">
        <template v-if="upcomingDates.length > 0">
          <div class="van-cell-group-title">{{ $t('recurring_transaction_page.upcoming') }}:</div>
          <div class="px-3 pb-15 flex-column text-size-12">
            <div v-for="date in upcomingDates" :key="date">{{ date }}</div>
          </div>
        </template>
        <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
      </app-card-info>

      <van-cell-group inset>
        <app-field v-model="title" name="Name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" />

        <icon-select v-model="icon" />

        <transaction-type-select v-model="type" name="transactionType" :rules="[rule.required()]" required />

        <app-field v-model="amount" name="amount" :label="$t('amount')" type="number" :icon="TablerIconConstants.cashBanknote" :rules="[rule.required()]" />

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

        <app-field v-model="description" name="description" :label="$t('description')" rows="1" autosize :icon="TablerIconConstants.fieldText1" :placeholder="title" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title">{{ $t('recurring_transaction_page.repetition') }}:</div>

        <recurring-repetition-type-select v-model="repetitionType" name="repetitionType" :rules="[rule.required()]" required />

        <weekday-select v-if="isRepetitionWeekly || isRepetitionNdom" v-model="repetitionWeekday" name="repetitionWeekday" :rules="[rule.required()]" required />

        <app-field
          v-if="isRepetitionMonthly"
          v-model="repetitionDay"
          name="repetitionDay"
          :label="$t('recurring_transaction_page.day_of_month')"
          type="number"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="[rule.required()]"
        />

        <app-field
          v-if="isRepetitionNdom"
          v-model="repetitionWeek"
          name="repetitionWeek"
          :label="$t('recurring_transaction_page.week_of_month')"
          type="number"
          :icon="TablerIconConstants.settingsUserPreferencesDate"
          :rules="[rule.required()]"
        />

        <app-date v-if="isRepetitionYearly" v-model="repetitionDate" name="repetitionDate" :label="$t('recurring_transaction_page.yearly_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" :rules="[rule.required()]" />

        <app-date v-model="firstDate" name="firstDate" :label="$t('recurring_transaction_page.first_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" :rules="[rule.required()]" />
        <app-date v-model="repeatUntil" :label="$t('recurring_transaction_page.repeat_until')" :icon="TablerIconConstants.settingsUserPreferencesDate" />
        <app-field v-model="nrOfRepetitions" name="nrOfRepetitions" :label="$t('recurring_transaction_page.nr_of_repetitions')" type="number" :icon="TablerIconConstants.fieldText2" />

        <app-boolean v-model="active" :label="$t('active')" />

        <app-field v-model="notes" name="notes" :label="$t('notes')" rows="2" autosize :icon="TablerIconConstants.description" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import _, { isEqual } from 'lodash-es'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import { useToolbar } from '~/composables/useToolbar'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import RecurringTransactionTransformer from '~/transformers/RecurringTransactionTransformer.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import Transaction from '~/models/Transaction.js'
import Account from '~/models/Account.js'
import DateUtils from '~/utils/DateUtils.js'
import { rule } from '~/utils/ValidationUtils.js'

const recurringTransactionStore = useRecurringTransactionStore()
const profileStore = useProfileStore()

const form = ref(null)

const resetFields = () => {
  title.value = ''
}

const fetchItem = () => {
  item.value = recurringTransactionStore.recurringTransactionDictionary[useRoute().params.id]
}

const upcomingDates = computed(() => RecurringTransaction.getOccurrences(item.value).map((date) => DateUtils.dateToUI(date)))

const onNavigateToTransactionsList = async () => {
  const filters = TransactionFilterUtils.filters.recurrence.toUrl(item.value)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = RecurringTransactionTransformer.transformFromApi(newItem)
    recurringTransactionStore.recurringTransactionList = [newItem, ...recurringTransactionStore.recurringTransactionList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    recurringTransactionStore.recurringTransactionList = recurringTransactionStore.recurringTransactionList.filter((item) => item.id !== itemId.value)
  }
}

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
  routeForm: RouteConstants.ROUTE_RECURRING_TRANSACTION_ID,
  model: new RecurringTransaction(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { title, icon, type, amount, accountSource, accountDestination, category, budget, tags, description, repetitionType, repetitionWeekday, repetitionDay, repetitionWeek, repetitionDate, firstDate, repeatUntil, nrOfRepetitions, active, notes } =
  generateChildren(item, [
    { computed: 'title', parentKey: 'attributes.title' },
    { computed: 'icon', parentKey: `attributes.icon` },
    { computed: 'type', parentKey: `attributes.type` },
    { computed: 'amount', parentKey: `attributes.amount` },
    { computed: 'accountSource', parentKey: `attributes.accountSource` },
    { computed: 'accountDestination', parentKey: `attributes.accountDestination` },
    { computed: 'category', parentKey: `attributes.category` },
    { computed: 'budget', parentKey: `attributes.budget` },
    { computed: 'tags', parentKey: `attributes.tags` },
    { computed: 'description', parentKey: `attributes.description` },
    { computed: 'repetitionType', parentKey: `attributes.repetitionType` },
    { computed: 'repetitionWeekday', parentKey: `attributes.repetitionWeekday` },
    { computed: 'repetitionDay', parentKey: `attributes.repetitionDay` },
    { computed: 'repetitionWeek', parentKey: `attributes.repetitionWeek` },
    { computed: 'repetitionDate', parentKey: `attributes.repetitionDate` },
    { computed: 'firstDate', parentKey: `attributes.first_date` },
    { computed: 'repeatUntil', parentKey: `attributes.repeat_until` },
    { computed: 'nrOfRepetitions', parentKey: `attributes.nr_of_repetitions` },
    { computed: 'active', parentKey: `attributes.active` },
    { computed: 'notes', parentKey: `attributes.notes` },
  ])

const isRepetitionWeekly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.weekly))
const isRepetitionMonthly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.monthly))
const isRepetitionNdom = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.ndom))
const isRepetitionYearly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.yearly))

const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))

const accountSourceBinding = computed(() => {
  const isRequired = isTypeExpense.value || isTypeTransfer.value
  return {
    required: isRequired,
    rules: isRequired ? [{ required: true, message: 'Source account is required!' }] : [],
  }
})

const accountDestinationBinding = computed(() => {
  const isRequired = isTypeIncome.value || isTypeTransfer.value
  return {
    required: isRequired,
    rules: isRequired ? [{ required: true, message: 'Destination account is required!' }] : [],
  }
})

watch(title, (newValue) => {
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  title.value = newValue
})

const toolbar = useToolbar()
const { t } = useI18n()
toolbar.init({
  title: itemId.value ? t('recurring_transaction_page.title_edit') : t('recurring_transaction_page.title_add'),
  backRoute: RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST,
})
</script>
