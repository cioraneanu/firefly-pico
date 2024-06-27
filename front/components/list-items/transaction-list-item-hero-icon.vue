<template>
  <div v-if="isAnyIconVisible" class="hero-icons-section gap-1 flex-center-vertical">
    <template v-if="isAccountIconVisible">
      <app-icon v-for="accountIcon in accountIcons" :icon="accountIcon" :size="30" />
    </template>

    <template v-if="isTagIconVisible">
      <app-icon :icon="tagIcon" :size="30" />
    </template>

    <template v-if="isCategoryIconVisible">
      <app-icon :icon="categoryIcon" :size="30" />
    </template>

    <template v-if="isWeekdayIconVisible">
      <div style="padding: 2px">
        <div class="hero-icon-weekday">{{ dayOfWeek }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import _, { get, isEmpty, isEqual } from 'lodash'
import DateUtils from '~/utils/DateUtils'
import { format } from 'date-fns'
import Account from '~/models/Account.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Transaction from '~/models/Transaction.js'
import { HERO_ICONS } from '~/constants/TransactionConstants.js'

const props = defineProps({
  value: Object,
})

const profileStore = useProfileStore()
const dataStore = useDataStore()

const emit = defineEmits(['onEdit', 'onDelete'])

const transactions = computed(() => _.get(props.value, 'attributes.transactions', []))
const firstTransaction = computed(() => _.head(transactions.value))
const transactionType = computed(() => _.get(firstTransaction.value, 'type'))

const isTypeExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(transactionType.value, Transaction.types.transfer))

const category = computed(() => _.get(firstTransaction.value, 'category.attributes.name'))

const tags = computed(() => {
  return firstTransaction.value.tags ?? []
})

const date = computed(() => DateUtils.autoToDate(_.get(firstTransaction.value, 'date')))
const dayOfWeek = computed(() => (date.value ? format(date.value, 'E').toUpperCase() : ''))
const time = computed(() => (date.value ? format(date.value, 'HH:mm') : ''))
const timeHour = computed(() => (date.value ? format(date.value, 'HH') : ''))
const timeMinute = computed(() => (date.value ? format(date.value, 'mm') : ''))

const accountIcons = computed(() => {
  const destinationAccount = get(dataStore.accountDictionary, get(firstTransaction.value, 'destination_id'))
  const destinationAccountIcon = Account.getIcon(destinationAccount) ?? TablerIconConstants.account

  const sourceAccount = get(dataStore.accountDictionary, get(firstTransaction.value, 'source_id'))
  const sourceAccountIcon = Account.getIcon(sourceAccount) ?? TablerIconConstants.account

  if (isTypeExpense.value) {
    return [sourceAccountIcon]
  }
  if (isTypeIncome.value) {
    return [destinationAccountIcon]
  }
  return [sourceAccountIcon, destinationAccountIcon]
})

const tagIcon = computed(() => {
  let sortedTags = sortByPath(tags.value, 'attributes.parent_id', false)
  return get(sortedTags, '0.attributes.icon.icon') ?? TablerIconConstants.tag
})
const categoryIcon = computed(() => {
  const category = get(dataStore.categoryDictionary, get(firstTransaction.value, 'category_id'))
  return get(category, 'attributes.icon.icon') ?? TablerIconConstants.category
})

const isAccountIconVisible = computed(() => profileStore.heroIcons.some((item) => item.code === HERO_ICONS.account))
const isTagIconVisible = computed(() => profileStore.heroIcons.some((item) => item.code === HERO_ICONS.tag) && !isEmpty(tags.value))
const isCategoryIconVisible = computed(() => profileStore.heroIcons.some((item) => item.code === HERO_ICONS.category))
const isWeekdayIconVisible = computed(() => profileStore.heroIcons.some((item) => item.code === HERO_ICONS.dayOfWeek))
const isHourIconVisible = computed(() => profileStore.heroIcons.some((item) => item.code === HERO_ICONS.hour))

const isAnyIconVisible = computed(() => {
  return isAccountIconVisible.value || isTagIconVisible.value || isCategoryIconVisible.value || isWeekdayIconVisible || isHourIconVisible
})
</script>
