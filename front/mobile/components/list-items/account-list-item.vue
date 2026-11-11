<template>
  <app-list-item row-class="mx-row--acc" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <span class="mx-lead"><app-icon :icon="icon ?? TablerIconConstants.account" :size="18" :stroke="2" /></span>
    <span class="mx-row__m">
      <span class="hd">
        <span class="mx-row__t">{{ displayName }}</span>
        <span class="mx-amt mx-money" :class="{ 'e neg': isNegative }">{{ accountBalance }}</span>
      </span>
      <span class="mx-chips">
        <span v-if="accountType" class="mx-chip fill"
          ><span>{{ accountType }}</span></span
        >
        <span v-if="accountRole" class="mx-chip"
          ><span>{{ $t('account_page.account_role') }}: {{ accountRole }}</span></span
        >
        <span v-if="accountGroup" class="mx-chip"
          ><span>{{ $t('account_page.account_group') }}: {{ accountGroup }}</span></span
        >
        <span v-if="hasVirtualBalance" class="mx-chip"
          ><span>{{ $t('account_page.available') }}: {{ accountAvailableBalance }}</span></span
        >
      </span>
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Account from '~/core/models/Account.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const { t } = useI18n()

const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const accountGroup = computed(() => get(props.value, 'attributes.group'))
const accountType = computed(() => {
  const translate = get(props.value, 'attributes.type.t')
  return translate ? t(translate) : null
})
const accountRole = computed(() => {
  const translate = get(props.value, 'attributes.account_role.t')
  return translate ? t(translate) : null
})
const accountBalance = computed(() => Account.getBalanceWithCurrency(props.value))
const isNegative = computed(() => Account.getBalance(props.value) < 0)
const accountAvailableBalance = computed(() => Account.getAvailableBalanceWithCurrency(props.value))
const hasVirtualBalance = computed(() => Account.hasVirtualBalance(props.value))
const icon = computed(() => Account.getIcon(props.value))
</script>
