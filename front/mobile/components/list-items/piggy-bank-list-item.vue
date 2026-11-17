<template>
  <app-list-item row-class="" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead"><app-icon :icon="icon ?? TablerIconConstants.piggyBank" :size="18" :stroke="2" /></span>
    <span class="mx-pig">
      <span class="hd">
        <span class="mx-row__t">{{ displayName }}</span>
        <span class="mx-amt mx-money">{{ currentAmount }} {{ currencySymbol }}</span>
      </span>
      <span v-if="subtitle" class="mx-row__s">{{ subtitle }}</span>
      <span class="mx-prog"><span :style="{ width: `${Math.min(percent, 100)}%` }" /></span>
      <span class="meta">
        <span>{{ percent }} %</span>
        <span v-if="percent < 100" class="mx-money">/ {{ targetAmount }} {{ currencySymbol }}</span>
        <span v-else class="mx-chip ok"
          ><app-icon :icon="IconCircleCheck" :size="12" :stroke="2" /><span>{{ $t('piggy_bank_page.target_reached') }}</span></span
        >
      </span>
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconCircleCheck } from '@tabler/icons-vue'
import PiggyBank from '~/core/models/PiggyBank.js'
import Account from '~/core/models/Account.js'
import DateUtils from '~/core/utils/DateUtils.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const icon = computed(() => PiggyBank.getIcon(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const currentAmount = computed(() => PiggyBank.getCurrentAmount(props.value))
const targetAmount = computed(() => PiggyBank.getTargetAmount(props.value))
const percent = computed(() => Number(PiggyBank.getPercent(props.value).toFixed(0)))
const currencySymbol = computed(() => PiggyBank.getCurrencySymbol(props.value))
const accountName = computed(() => Account.getDisplayName(PiggyBank.getAccount(props.value)))
const targetDate = computed(() => DateUtils.dateToUI(PiggyBank.getTargetDate(props.value)))
const subtitle = computed(() => [accountName.value, targetDate.value].filter((item) => !!item).join(' · '))
</script>
