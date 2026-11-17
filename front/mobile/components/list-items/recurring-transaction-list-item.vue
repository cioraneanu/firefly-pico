<template>
  <app-list-item row-class="" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead"><app-icon :icon="icon ?? TablerIconConstants.recurringTransaction" :size="18" :stroke="2" /></span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ displayName }}</span>
      <span class="mx-chips">
        <span v-if="type" class="mx-chip ty" :class="typeStyle.cls"
          ><app-icon :icon="typeStyle.icon" :size="12" :stroke="2" /><span>{{ $t(type.t) }}</span></span
        >
        <span v-if="repetitionType" class="mx-chip"
          ><span>{{ repetitionType.name }}</span></span
        >
        <span v-if="nextDate" class="mx-chip"
          ><app-icon :icon="IconCalendarEvent" :size="12" :stroke="2" /><span>{{ $t('recurring_transaction_page.next_date') }}: {{ nextDate }}</span></span
        >
        <span v-if="!isActive" class="mx-chip fill"
          ><span>{{ $t('recurring_transaction_page.inactive') }}</span></span
        >
      </span>
    </span>
    <span class="mx-row__r">
      <span class="mx-amt mx-money" :class="typeStyle.amount">{{ amount }} {{ currencySymbol }}</span>
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconCalendarEvent, IconCircleArrowRight, IconCircleMinus, IconCirclePlus } from '@tabler/icons-vue'
import RecurringTransaction from '~/core/models/RecurringTransaction.js'
import Transaction from '~/core/models/Transaction.js'
import DateUtils from '~/core/utils/DateUtils.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

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

const typeStyle = computed(() => {
  switch (get(type.value, 'code')) {
    case Transaction.types.income.code:
      return { cls: 'inc', icon: IconCirclePlus, amount: 'i' }
    case Transaction.types.transfer.code:
      return { cls: 'tr', icon: IconCircleArrowRight, amount: 't' }
    default:
      return { cls: 'exp', icon: IconCircleMinus, amount: '' }
  }
})
</script>
