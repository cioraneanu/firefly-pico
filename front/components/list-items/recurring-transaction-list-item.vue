<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center flex-column">
            <app-icon :icon="icon ?? TablerIconConstants.recurringTransaction" :size="TablerIconConstants.defaultSize" />
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1 flex-column">
            <div v-if="displayName" class="title flex-center-vertical">
              <div class="flex-1">{{ displayName }}</div>
              <div class="text-size-12" :class="amountClass">{{ amount }} {{ currencySymbol }}</div>
            </div>
            <div class="display-flex flex-wrap gap-1 mt-5">
              <div v-if="type" class="tag-gray list-item-subtitle text-size-12">{{ $t(type.t) }}</div>
              <div v-if="repetitionType" class="tag-gray list-item-subtitle text-size-12">{{ repetitionType.name }}</div>
              <div v-if="nextDate" class="tag-gray list-item-subtitle text-size-12">{{ $t('recurring_transaction_page.next_date') }}: {{ nextDate }}</div>
              <div v-if="!isActive" class="tag-gray list-item-subtitle text-size-12">{{ $t('recurring_transaction_page.inactive') }}</div>
            </div>
          </div>
        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import { get } from 'lodash-es'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const icon = computed(() => RecurringTransaction.getIcon(props.value))
const displayName = computed(() => get(props.value, 'attributes.title', ' - '))
const amount = computed(() => RecurringTransaction.getAmountFormatted(props.value))
const currencySymbol = computed(() => RecurringTransaction.getCurrencySymbol(props.value))
const type = computed(() => RecurringTransaction.getType(props.value))
const repetitionType = computed(() => RecurringTransaction.getRepetitionType(props.value))
const nextDate = computed(() => DateUtils.dateToUI(RecurringTransaction.getNextOccurrence(props.value)))
const isActive = computed(() => RecurringTransaction.isActive(props.value))

const amountClass = computed(() => {
  switch (get(type.value, 'code')) {
    case Transaction.types.expense.code:
      return 'text-danger'
    case Transaction.types.income.code:
      return 'text-success'
    case Transaction.types.transfer.code:
      return 'text-primary'
    default:
      return ''
  }
})

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>

