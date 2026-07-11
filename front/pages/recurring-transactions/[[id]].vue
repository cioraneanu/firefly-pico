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
          <div class="px-3 display-flex gap-1 flex-wrap text-size-12">
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
          min="1"
          max="31"
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
          min="1"
          max="5"
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
          min="1"
          max="255"
          required
        />

        <app-boolean v-model="active" :label="$t('active')" />

        <app-field v-model="notes" name="notes" :label="$t('notes')" rows="2" autosize :icon="TablerIconConstants.description" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-10" @click="onDelete" />
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
import { addDays, startOfDay, subYears } from 'date-fns'

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

const {
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
} = generateChildren(item, [
  { computed: 'title', parentKey: 'attributes.title' },
  { computed: 'icon', parentKey: `attributes.icon` },
  { computed: 'type', parentKey: `attributes.type` },
  { computed: 'amount', parentKey: `attributes.amount` },
  { computed: 'amountForeign', parentKey: `attributes.amountForeign` },
  { computed: 'currencyForeign', parentKey: `attributes.currencyForeign` },
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
  { computed: 'repetitionEndType', parentKey: `attributes.repetitionEndType` },
  { computed: 'repeatUntil', parentKey: `attributes.repeat_until` },
  { computed: 'nrOfRepetitions', parentKey: `attributes.nr_of_repetitions` },
  { computed: 'active', parentKey: `attributes.active` },
  { computed: 'notes', parentKey: `attributes.notes` },
])

const isRepetitionWeekly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.weekly))
const isRepetitionMonthly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.monthly))
const isRepetitionNdom = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.ndom))
const isRepetitionYearly = computed(() => isEqual(repetitionType.value, RecurringTransaction.repetitionTypes.yearly))

const isEndUntilDate = computed(() => isEqual(repetitionEndType.value, RecurringTransaction.repetitionEndTypes.untilDate))
const isEndNrOfTimes = computed(() => isEqual(repetitionEndType.value, RecurringTransaction.repetitionEndTypes.nrOfTimes))
const maxFireflyDate = new Date(2038, 0, 16)
const firstDateMin = computed(() => (itemId.value ? subYears(new Date(), 5) : startOfDay(addDays(new Date(), 1))))
const firstDateRules = computed(() => [rule.required(), ...(!itemId.value ? [rule.afterDate(new Date())] : [])])
const repeatUntilRules = computed(() => [rule.required(), rule.afterDate(firstDate.value, true)])

// Firefly III only accepts one end condition, so clear the value that no longer applies
watch(repetitionEndType, () => {
  if (!isEndUntilDate.value) {
    repeatUntil.value = null
  }
  if (!isEndNrOfTimes.value) {
    nrOfRepetitions.value = null
  }
})

const isTypeExpense = computed(() => isEqual(type.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(type.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(type.value, Transaction.types.transfer))

const accountSourceAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeSource(type.value))
const accountDestinationAllowedTypes = computed(() => Account.getAccountTypesForTransactionTypeDestination(type.value))
const isIncomeFromLiability = computed(() => isTypeIncome.value && isEqual(Account.getType(accountSource.value), Account.types.liability))
const amountCurrency = computed(() => Account.getCurrency(isTypeIncome.value && !isIncomeFromLiability.value ? accountDestination.value : accountSource.value))

const isForeignAmountVisible = computed(() => {
  const sourceCurrency = Account.getCurrency(accountSource.value)
  const destinationCurrency = Account.getCurrency(accountDestination.value)
  const currencyAwareTypes = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode]
  const sourceType = Account.getType(accountSource.value)?.fireflyCode
  const destinationType = Account.getType(accountDestination.value)?.fireflyCode
  return Boolean(currencyAwareTypes.includes(sourceType) && currencyAwareTypes.includes(destinationType) && sourceCurrency && destinationCurrency && sourceCurrency.id !== destinationCurrency.id)
})

watch(type, (newValue, oldValue) => {
  if (itemId.value || !oldValue || isEqual(newValue, oldValue)) {
    return
  }
  const { source, destination } = Transaction.attemptAccountFixOnTypeChange(newValue, accountSource.value, accountDestination.value)
  accountSource.value = source
  accountDestination.value = destination
})

watch([accountSource, accountDestination], () => {
  if (isForeignAmountVisible.value) {
    currencyForeign.value = Account.getCurrency(accountDestination.value)
    return
  }
  amountForeign.value = ''
  currencyForeign.value = null
})

const accountSourceBinding = computed(() => {
  const isRequired = isTypeExpense.value || isTypeTransfer.value
  return {
    required: isRequired,
    clearable: isRequired || !itemId.value,
    rules: isRequired ? [rule.required()] : [],
  }
})

const accountDestinationBinding = computed(() => {
  const isRequired = isTypeIncome.value || isTypeTransfer.value
  return {
    required: isRequired,
    clearable: isRequired || !itemId.value,
    rules: isRequired ? [rule.required()] : [],
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
