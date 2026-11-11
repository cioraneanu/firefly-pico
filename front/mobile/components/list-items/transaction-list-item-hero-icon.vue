<template>
  <span v-if="isAnyIconVisible" class="mx-lead w-auto min-w-9 px-[9px] grid-flow-col gap-1">
    <template v-if="isAccountIconVisible">
      <app-icon v-for="(accountIcon, index) in accountIcons" :key="index" :icon="accountIcon" :size="18" :stroke="2" />
    </template>
    <app-icon v-if="isTagIconVisible" :icon="tagIcon" :size="18" :stroke="2" />
    <app-icon v-if="isCategoryIconVisible" :icon="categoryIcon" :size="18" :stroke="2" />
    <span v-if="isWeekdayIconVisible" class="text-10 font-bold leading-none">{{ dayOfWeek }}</span>
    <transaction-type-dot :transaction-type="transactionType" class="mx-lead__dot" />
  </span>
  <transaction-type-dot v-else :transaction-type="transactionType" class="mt-1.5" />
</template>

<script setup>
import { get, head, isEmpty, isEqual } from 'lodash-es'
import DateUtils from '~/core/utils/DateUtils'
import { format } from 'date-fns'
import Account from '~/core/models/Account.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Transaction from '~/core/models/Transaction.js'
import { transactionListHeroIcon } from '~/core/constants/TransactionConstants.js'
import { useAccountStore } from '~/core/stores/accountStore'
import { useCategoryStore } from '~/core/stores/categoryStore'
import { useProfileStore } from '~/core/stores/profileStore'

// Lead tile of a transaction row: the hero icons picked in the list settings, with the type dot on its corner.
const props = defineProps({
  value: Object,
})

const profileStore = useProfileStore()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()

const firstTransaction = computed(() => head(get(props.value, 'attributes.transactions', [])))
const transactionType = computed(() => get(firstTransaction.value, 'type'))

const isTypeExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))

const tags = computed(() => firstTransaction.value?.tags ?? [])

const date = computed(() => DateUtils.autoToDate(get(firstTransaction.value, 'date')))
const dayOfWeek = computed(() => (date.value ? format(date.value, 'E').toUpperCase() : ''))

const accountIcons = computed(() => {
  // Draft transactions (e.g. ramble previews) embed the account objects instead of ids.
  const destinationAccount = get(accountStore.accountDictionary, get(firstTransaction.value, 'destination_id')) ?? get(firstTransaction.value, 'accountDestination')
  const destinationAccountIcon = Account.getIcon(destinationAccount) ?? TablerIconConstants.account

  const sourceAccount = get(accountStore.accountDictionary, get(firstTransaction.value, 'source_id')) ?? get(firstTransaction.value, 'accountSource')
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
  const sortedTags = sortByPath(tags.value, 'attributes.parent_id', false)
  return get(sortedTags, '0.attributes.icon.icon') ?? TablerIconConstants.tag
})
const categoryIcon = computed(() => {
  const category = get(categoryStore.categoryDictionary, get(firstTransaction.value, 'category_id')) ?? get(firstTransaction.value, 'category')
  return get(category, 'attributes.icon.icon') ?? TablerIconConstants.category
})

const hasHeroIcon = (heroIcon) => profileStore.heroIcons.some((item) => item.code === heroIcon.code)
const isAccountIconVisible = computed(() => hasHeroIcon(transactionListHeroIcon.account))
const isTagIconVisible = computed(() => profileStore.tagsEnabled && hasHeroIcon(transactionListHeroIcon.tags) && !isEmpty(tags.value))
const isCategoryIconVisible = computed(() => profileStore.categoriesEnabled && hasHeroIcon(transactionListHeroIcon.category))
const isWeekdayIconVisible = computed(() => hasHeroIcon(transactionListHeroIcon.dayOfWeek))

const isAnyIconVisible = computed(() => isAccountIconVisible.value || isTagIconVisible.value || isCategoryIconVisible.value || isWeekdayIconVisible.value)
</script>
