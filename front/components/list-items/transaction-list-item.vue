<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell :class="cellClass">
      <template #title>
        <div class="display-flex transaction-card prevent-select align-items-lg-stretch">
          <div class="second_column flex-1">
            <div v-if="isSplitPayment && props.isDetailedMode" class="mt-1 display-flex">
              <transaction-split-badge />
            </div>

            <div class="flex-center-vertical gap-1">
              <div v-if="description" class="list-item-title">{{ description }}</div>
              <app-icon v-if="hasAttachments" :icon="TablerIconConstants.attachment" :size="20" color="#1E88E5" />
            </div>

            <div class="flex-column" :style="getStyleForField(transactionListField.accounts)">
              <div v-for="displayedAccount in displayedAccounts" class="list-item-subtitle">
                <app-icon :icon="Account.getIcon(displayedAccount) ?? TablerIconConstants.account" :size="20" />
                <span>{{ Account.getDisplayName(displayedAccount) }}</span>
              </div>
            </div>

            <div v-if="categories && props.isDetailedMode" class="list-item-subtitle gap-2" :style="getStyleForField(transactionListField.category)">
              <div v-for="category in categories">
                <app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="20" />
                {{ Category.getDisplayName(category) }}
              </div>
            </div>

            <div v-if="notes && props.isDetailedMode" class="list-item-subtitle" :style="getStyleForField(transactionListField.notes)">
              <app-icon :icon="TablerIconConstants.fieldText1" :size="20" />
              <span class="notes-markdown" v-html="notes" />
            </div>

            <div v-if="tags && props.isDetailedMode" class="tags-container" :style="getStyleForField(transactionListField.tags)">
              <div v-for="tag in visibleTags" class="tag">
                <app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="14" />
                <div class="list-item-subtitle ml-5">{{ Tag.getDisplayNameEllipsized(tag, 10) }}</div>
              </div>
            </div>

            <div v-if="budget && props.isDetailedMode" class="list-item-subtitle" :style="getStyleForField(transactionListField.budget)">
              <app-icon :icon="TablerIconConstants.budget" :size="20" />
              {{ Budget.getDisplayName(budget) }}
            </div>
          </div>

          <div class="third_column">
            <div class="font-weight-700 text-size-14" :style="amountStyle">{{ transactionAmount }} {{ transactionCurrency }}</div>

            <transaction-list-item-hero-icon v-if="props.isDetailedMode" :value="props.value" />

            <div class="display-flex flex-column align-items-end text-size-12 gap-1 line-height-normal mt-1">
              <div>{{ dateFormatted }}</div>
              <div class="text-muted">{{ timeAgo }}</div>
            </div>

            <div class="flex-center-vertical text-muted text-size-12 gap-1"></div>
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
import { capitalize, get, head, isEqual } from 'lodash'
import Category from '@/models/Category.js'
import DateUtils from '~/utils/DateUtils'
import { format } from 'date-fns'
import Transaction from '~/models/Transaction'
import Budget from '~/models/Budget.js'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Tag from '@/models/Tag.js'
import Account from '~/models/Account.js'
import TransactionListItemHeroIcon from '~/components/list-items/transaction-list-item-hero-icon.vue'
import TransactionSplitBadge from '~/components/transaction/transaction-split-badge.vue'
import { transactionListField } from '~/constants/TransactionConstants.js'
import { marked } from 'marked'
import { formatTimeAgo } from '@vueuse/core'
import { IconPhoto } from '@tabler/icons-vue'

const props = defineProps({
  value: Object,
  isDetailedMode: {
    default: true,
  },
})

const dataStore = useDataStore()

const emit = defineEmits(['onEdit', 'onDelete'])

const transactions = computed(() => get(props.value, 'attributes.transactions', []))
const firstTransaction = computed(() => head(transactions.value))
const transactionType = computed(() => get(firstTransaction.value, 'type', ' - '))

const isSplitPayment = computed(() => transactions.value.length > 1)

const displayedAccounts = computed(() => {
  return [sourceAccount.value, destinationAccount.value].filter((item) => !!item)
})

const description = computed(() => get(props.value, 'attributes.group_title') ?? get(firstTransaction.value, 'description') ?? ' - ')
const hasAttachments = computed(() => transactions.value.some((item) => item.has_attachments))

const categories = computed(() => {
  return transactions.value
    .map((item) => item.category)
    .flat()
    .filter(Boolean)
    .uniqBy('id')
})
const notes = computed(() => {
  let result = get(firstTransaction.value, 'notes')
  return result ? marked(result) : null
})

const tags = computed(() => {
  return transactions.value
    .map((item) => item.tags)
    .flat()
    .filter(Boolean)
    .uniqBy('id')
})

const budget = computed(() => get(firstTransaction.value, 'budget'))

const isTodo = computed(() => tags.value.some((tag) => get(tag, 'attributes.is_todo')))
const cellClass = computed(() => ({
  'transaction-list-item-todo': isTodo.value,
}))

const visibleTags = computed(() => {
  return tags.value.slice(0, 4)
})

const amountSign = computed(() => (isTypeExpense.value ? '-' : isTypeIncome.value ? '+' : ''))
const transactionAmount = computed(() => `${amountSign.value}${Transaction.getAmountFormatted(props.value)}`)
const transactionCurrency = computed(() => get(firstTransaction.value, 'currency_symbol', ' - '))

const isTypeExpense = computed(() => isEqual(transactionType.value, Transaction.types.expense))
const isTypeIncome = computed(() => isEqual(transactionType.value, Transaction.types.income))
const isTypeTransfer = computed(() => isEqual(transactionType.value, Transaction.types.transfer))

const date = computed(() => DateUtils.autoToDate(get(firstTransaction.value, 'date')))
const dateFormatted = computed(() => DateUtils.dateToUI(date.value))
const dayOfWeek = computed(() => DateUtils.dateToString(date.value, 'EEEEEE'))
const timeAgo = computed(() => capitalize(formatTimeAgo(date.value)))

const destinationAccount = computed(() => {
  let destinationId = get(firstTransaction.value, 'destination_id')
  return get(dataStore.accountDictionary, destinationId)
})

const sourceAccount = computed(() => {
  let sourceId = get(firstTransaction.value, 'source_id')
  return get(dataStore.accountDictionary, sourceId)
})

const profileStore = useProfileStore()
const getStyleForField = ({ code }) => {
  let position = profileStore.transactionListFieldsConfig.findIndex((item) => item.code === code)
  let field = profileStore.transactionListFieldsConfig.find((item) => item.code === code)
  let isVisible = field ? field.isVisible : true
  let displayStyle = isVisible ? '' : 'display: none'

  return `order: ${position}; ${displayStyle}`
}

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const amountStyle = computed(() => {
  if (isTypeExpense.value) {
    return `color: var(--expense2)`
  }
  if (isTypeIncome.value) {
    return `color: var(--income1)`
  }
  if (isTypeTransfer.value) {
    return `color: var(--transfer1)`
  }
})

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>
