<template>
  <app-list-item row-class="mx-tx" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <div class="hd">
      <span class="mx-lead"><app-icon :icon="TablerIconConstants.transactionTemplate" :size="18" :stroke="2" /></span>
      <div class="m">
        <span class="flex items-center gap-1.5 min-w-0">
          <transaction-type-dot :transaction-type="value.type" />
          <span class="mx-row__t">{{ name }}</span>
        </span>
        <span v-if="extraNames" class="mx-row__s mx-notes"
          ><app-icon :icon="IconKeyboard" :size="13" :stroke="2" /><span>{{ extraNames }}</span></span
        >
      </div>
      <span v-if="transactionAmount > 0" class="r"
        ><span class="mx-amt mx-money">{{ transactionAmount }} {{ transactionCurrency }}</span></span
      >
    </div>
    <span v-if="description" class="mx-row__s mx-notes"
      ><app-icon :icon="TablerIconConstants.description" :size="13" :stroke="2" /><span>{{ description }}</span></span
    >
    <span v-if="notes" class="mx-row__s mx-notes"
      ><app-icon :icon="TablerIconConstants.notes" :size="13" :stroke="2" /><span>{{ notes }}</span></span
    >
    <span v-if="hasChips" class="mx-chips" style="margin-top: 0">
      <span v-for="account in displayedAccounts" :key="`account-${account.id}`" class="mx-chip fill"
        ><app-icon :icon="Account.getIcon(account) ?? TablerIconConstants.account" :size="12" :stroke="2" /><span>{{ Account.getDisplayName(account) }}</span></span
      >
      <span v-if="category" class="mx-chip"
        ><app-icon :icon="Category.getIcon(category) ?? TablerIconConstants.category" :size="12" :stroke="2" /><span>{{ Category.getDisplayName(category) }}</span></span
      >
      <span v-if="budget" class="mx-chip"
        ><app-icon :icon="Budget.getIcon(budget) ?? TablerIconConstants.budget" :size="12" :stroke="2" /><span>{{ Budget.getDisplayName(budget) }}</span></span
      >
      <span v-for="tag in visibleTags" :key="`tag-${tag.id}`" class="mx-chip"
        ><app-icon :icon="Tag.getIcon(tag) ?? TablerIconConstants.tag" :size="12" :stroke="2" /><span>{{ Tag.getDisplayNameEllipsized(tag, 10) }}</span></span
      >
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconKeyboard } from '@tabler/icons-vue'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import Tag from '~/core/models/Tag.js'
import Budget from '~/core/models/Budget.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const name = computed(() => get(props.value, 'name', ' - '))
const extraNames = computed(() =>
  get(props.value, 'extra_names', [])
    .map((item) => item.value)
    .join(', ')
    .slice(0, 50),
)
const description = computed(() => get(props.value, 'description'))
const notes = computed(() => get(props.value, 'notes'))
const budget = computed(() => get(props.value, 'budget'))
const category = computed(() => get(props.value, 'category'))
const visibleTags = computed(() => (get(props.value, 'tags') ?? []).slice(0, 4))

const transactionAmount = computed(() => get(props.value, 'amount'))
const transactionCurrency = computed(() => get(props.value, 'currency_symbol'))

const displayedAccounts = computed(() => [get(props.value, 'account_source'), get(props.value, 'account_destination')].filter((item) => !!item))
const hasChips = computed(() => displayedAccounts.value.length > 0 || category.value || budget.value || visibleTags.value.length > 0)
</script>
