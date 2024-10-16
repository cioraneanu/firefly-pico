<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell :class="cellClass">
      <template #title>
        <div class="display-flex transaction-card prevent-select align-items-lg-stretch">
          <!--          <div class="first_column flex-center flex-column">-->
          <!--            <div class="font-700 text-size-14">{{ dateDayOfMonth }}</div>-->
          <!--            <div class="font-500 text-size-12" style="margin-top: -5px">{{ dateMonth }}</div>-->
          <!--            <div class="day-of-week" style="margin-top: -2px">{{ dateWeekdayName }}</div>-->
          <!--          </div>-->

          <!--          <div class="separator"></div>-->

          <div class="second_column flex-1">
            <div class="flex-center-vertical gap-2">
              <transaction-type-dot :transactionType="transactionType" class="ml-5" />
              <div v-if="description" class="list-item-title">{{ description }}</div>
            </div>

            <div class="flex-column">
              <div v-for="displayedAccount in displayedAccounts" class="list-item-subtitle">
                <app-icon :icon="Account.getIcon(displayedAccount) ?? TablerIconConstants.account" :size="20" />
                <span>{{ Account.getDisplayName(displayedAccount) }}</span>
              </div>
            </div>

            <div v-if="category && props.isDetailedMode" class="list-item-subtitle">
              <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="20" />
              {{ Category.getDisplayName(category) }}
            </div>

            <div v-if="notes && props.isDetailedMode" class="list-item-subtitle">
              <app-icon :icon="TablerIconConstants.fieldText1" :size="20" />
              {{ notes }}
            </div>

            <div v-if="tags && props.isDetailedMode" class="tags-container">
              <div v-for="tag in visibleTags" class="tag">
                <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
                <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
              </div>
            </div>

            <div v-if="isSplitPayment && props.isDetailedMode">
              <van-tag class="" type="warning"> Split payment</van-tag>
            </div>
          </div>

          <!--          <div class="separator"></div>-->

          <div class="third_column">
            <div class="font-weight-700 text-size-16">{{ transactionAmount }} {{ transactionCurrency }}</div>

            <transaction-list-item-hero-icon v-if="props.isDetailedMode" :value="props.value" />

            <!--            <div-->
            <!--                v-if="heroIcon.length > 0 && props.isDetailedMode"-->
            <!--                class="hero-icons-section gap-1 flex-center-vertical">-->
            <!--              <app-icon-->
            <!--                  v-for="(icon, index) in heroIcon"-->
            <!--                  :icon="icon"-->
            <!--                  :size="30"/>-->
            <!--            </div>-->

            <div class="flex-center-vertical text-muted text-size-12">
              {{ dateFormatted }}
            </div>

            <!--            <div v-if="props.isDetailedMode" class="day-of-week" style="margin-top: -2px">{{ dateWeekdayName }}</div>-->
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button @click="onDelete" class="delete-button" square type="danger" text="Delete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import _, { get, isEqual } from 'lodash'
import Category from '../../models/Category.js'
import DateUtils from '~/utils/DateUtils'
import { format } from 'date-fns'
import Transaction from '~/models/Transaction'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '../../models/Tag.js'
import Account from '~/models/Account.js'
import TransactionListItemHeroIcon from '~/components/list-items/transaction-list-item-hero-icon.vue'

const props = defineProps({
  value: Object,
  isDetailedMode: {
    default: true,
  },
})

const dataStore = useDataStore()

const emit = defineEmits(['onEdit', 'onDelete'])

const transactions = computed(() => _.get(props.value, 'attributes.transactions', []))
const firstTransaction = computed(() => _.head(transactions.value))
const transactionType = computed(() => _.get(firstTransaction.value, 'type', ' - '))

const isSplitPayment = computed(() => transactions.value.length > 1)

const displayedAccounts = computed(() => {
  if (isTransactionExpense.value) {
    return [sourceAccount.value]
  }
  if (isTransactionIncome.value) {
    return [destinationAccount.value]
  }
  return [sourceAccount.value, destinationAccount.value]
})

const description = computed(() => _.get(firstTransaction.value, 'description', ' - '))
const category = computed(() => _.get(firstTransaction.value, 'category'))
const notes = computed(() => _.get(firstTransaction.value, 'notes', ' - '))
// const tags = computed(() => {
//   let list = firstTransaction.value.tags ?? []
//   return list.map(item => `${get(item, 'attributes.tag')}`)
// })

const tags = computed(() => {
  return firstTransaction.value.tags ?? []
})

const isTodo = computed(() => tags.value.some((tag) => get(tag, 'attributes.is_todo')))
const cellClass = computed(() => ({
  'transaction-list-item-todo': isTodo.value,
}))

const visibleTags = computed(() => {
  return tags.value.slice(0, 4)
})

// const transactionAmount = computed(() => _.get(props.value, 'attributes.transactions.0.amount', ' - '))

const transactionAmount = computed(() => Transaction.getAmount(props.value))
const transactionCurrency = computed(() => _.get(firstTransaction.value, 'currency_symbol', ' - '))

const isTransactionExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
const isTransactionIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))
const isTransactionTransfer = computed(() => isEqual(transactionType.value, Transaction.types.transfer))

const date = computed(() => DateUtils.autoToDate(_.get(firstTransaction.value, 'date')))
const dateFormatted = computed(() => DateUtils.dateToUI(date.value))
const dateMonth = computed(() => (date.value ? format(date.value, 'LLL').toUpperCase() : ''))
const dateWeekdayName = computed(() => (date.value ? format(date.value, 'E').toUpperCase() : ''))
const dateDayOfMonth = computed(() => {
  return date.value ? format(date.value, 'dd') : ''
})

const destinationAccount = computed(() => {
  let destinationId = get(firstTransaction.value, 'destination_id')
  return get(dataStore.accountDictionary, destinationId)
})

const sourceAccount = computed(() => {
  let sourceId = get(firstTransaction.value, 'source_id')
  return get(dataStore.accountDictionary, sourceId)
})

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const heroIcon = computed(() => {
  // let heroTagIcon =  get(tags.value, '0.attributes.icon.icon')
  let sortedTags = sortByPath(tags.value, 'attributes.parent_id', false)
  let heroTagIcon = get(sortedTags, '0.attributes.icon.icon')
  let heroAccountIcon = isTransactionExpense.value ? Account.getIcon(sourceAccount.value) : Account.getIcon(destinationAccount.value)

  let listOfIcons = [heroTagIcon, heroAccountIcon]
  return listOfIcons.filter((item) => !!item)
})

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
