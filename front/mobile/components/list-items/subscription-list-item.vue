<template>
  <app-list-item :row-class="{ 'is-off': !isActive }" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead"><app-icon :icon="icon ?? TablerIconConstants.subscription" :size="18" :stroke="2" /></span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ displayName }}</span>
      <span class="mx-row__s">{{ subtitle }}</span>
    </span>
    <span class="mx-row__r">
      <span class="mx-amt mx-money">{{ amount }} {{ currencySymbol }}</span>
      <span class="mx-chip" :class="`st-${state}`"
        ><span>{{ $t(`subscription_page.state.${state}`) }}</span></span
      >
    </span>
  </app-list-item>
</template>

<script setup>
import Subscription from '~/core/models/Subscription.js'
import DateUtils from '~/core/utils/DateUtils.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])
const { t } = useI18n()

const icon = computed(() => Subscription.getIcon(props.value))
const displayName = computed(() => Subscription.getDisplayName(props.value) ?? ' - ')
const isActive = computed(() => Subscription.isActive(props.value))
const amount = computed(() => +Subscription.getAverageAmount(props.value).toFixed(2))
const currencySymbol = computed(() => Subscription.getCurrencySymbol(props.value))
const state = computed(() => Subscription.getMonthStatus(props.value, new Date())?.state ?? 'not_due')
const subtitle = computed(() => {
  const repeatFreq = Subscription.getRepeatFreq(props.value)
  const nextDate = DateUtils.dateToUI(Subscription.getNextExpectedDate(props.value))
  return [repeatFreq && t(repeatFreq.t), nextDate && t('subscription_page.next', { date: nextDate })].filter(Boolean).join(' · ')
})
</script>
